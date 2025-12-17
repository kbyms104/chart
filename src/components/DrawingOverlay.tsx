import React, { useState, useRef } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { generateId, isPointNearLine, isPointInRect, getDistance } from '../utils/drawingUtils';
import type { Drawing, DrawingType, Point } from '../utils/drawingUtils';
import type { DataPoint } from '../types';
import { useEffect } from 'react';

interface Props {
    chart: IChartApi | undefined;
    series: ISeriesApi<"Candlestick"> | undefined;
    data: DataPoint[];
    drawings: Drawing[];

    activeTool: DrawingType | null;
    isMagnetMode: boolean;
    onAddDrawing: (drawing: Drawing) => void;
    onUpdateDrawing: (drawing: Drawing) => void;
    onDeleteDrawing: (id: string) => void;
    onDrawingComplete: () => void;
    width: number;
    height: number;
}

export const DrawingOverlay: React.FC<Props> = ({
    chart,
    series,
    data,
    drawings,

    activeTool,
    isMagnetMode,
    onAddDrawing,
    onUpdateDrawing,
    onDeleteDrawing,
    onDrawingComplete,
    width,
    height: _height
}) => {
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
    const [dragStartPoint, setDragStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [activeAnchorIndex, setActiveAnchorIndex] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, drawingId: string } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Coordinate conversion helpers
    const timeToX = (time: number) => {
        if (!chart) return 0;
        return chart.timeScale().timeToCoordinate(time as any) || 0;
    };

    const priceToY = (price: number) => {
        if (!series) return 0;
        return series.priceToCoordinate(price) || 0;
    };

    const coordinateToPoint = (x: number, y: number): Point | null => {
        if (!chart || !series) return null;
        const time = chart.timeScale().coordinateToTime(x) as number;
        const price = series.coordinateToPrice(y);
        if (time === null || price === null) return null;
        return { time, price };
    };

    const snapToCandle = (point: Point): Point => {
        if (!data || data.length === 0) return point;

        // Find nearest candle by time
        // Simple search for now, can be optimized
        let nearestCandle: DataPoint | null = null;
        let minTimeDiff = Infinity;

        for (const d of data) {
            const diff = Math.abs(d.time - point.time);
            if (diff < minTimeDiff) {
                minTimeDiff = diff;
                nearestCandle = d;
            }
        }

        if (!nearestCandle) return point;

        // Snap to OHLC
        const prices = [nearestCandle.open, nearestCandle.high, nearestCandle.low, nearestCandle.close];
        let nearestPrice = point.price;
        let minPriceDiff = Infinity;

        for (const p of prices) {
            const diff = Math.abs(p - point.price);
            if (diff < minPriceDiff) {
                minPriceDiff = diff;
                nearestPrice = p;
            }
        }

        return { time: nearestCandle.time, price: nearestPrice };

    };



    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only handle left clicks
        if (!chart || !series) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let point = coordinateToPoint(x, y);
        if (!point) return;

        if (isMagnetMode && activeTool) {
            point = snapToCandle(point);
        }

        // 1. Drawing Mode
        if (activeTool) {
            if (!currentDrawing) {
                // Handle 1-point tools immediately
                if (activeTool === 'horizontal-line' || activeTool === 'text' || activeTool === 'icon') {
                    const newDrawing: Drawing = {
                        id: generateId(),
                        type: activeTool,
                        points: [point],
                        properties: {
                            color: '#2962ff',
                            lineWidth: 2,
                            text: activeTool === 'text' ? 'Text Label' : undefined
                        }
                    };
                    onAddDrawing(newDrawing);
                    onDrawingComplete();
                    return;
                }

                // Handle Long/Short Position (Interactive: Click -> Drag -> Click)
                if (activeTool === 'long-position' || activeTool === 'short-position') {
                    const newDrawing: Drawing = {
                        id: generateId(),
                        type: activeTool,
                        points: [point, point, point], // Entry, TP, SL (all start at entry)
                        properties: { color: activeTool === 'long-position' ? '#4caf50' : '#f44336', lineWidth: 1 }
                    };
                    setCurrentDrawing(newDrawing);
                    return;
                }

                // Start new drawing for multi-point tools
                // Initialize with [start, start] so the second point tracks the mouse
                const newDrawing: Drawing = {
                    id: generateId(),
                    type: activeTool,
                    points: [point, point],
                    properties: { color: '#2962ff', lineWidth: 2 }
                };
                setCurrentDrawing(newDrawing);

            } else {
                // Continue drawing
                // Update the last point to the current click position
                const newPoints = [...currentDrawing.points];
                newPoints[newPoints.length - 1] = point;

                // Determine target point count
                let targetPoints = 2;
                if (activeTool === 'elliott-wave') targetPoints = 5;
                if (activeTool === 'pitchfork') targetPoints = 3;
                if (activeTool === 'brush') targetPoints = 999; // Brush is handled differently, usually via mouse move

                if (activeTool === 'brush') {
                    // Brush shouldn't really be here in handleMouseDown for continuation usually, 
                    // but if it is, just add a point
                    setCurrentDrawing({ ...currentDrawing, points: [...currentDrawing.points, point] });
                    return;
                }

                if (activeTool === 'long-position' || activeTool === 'short-position') {
                    // On second click, finalize the drawing (points are already updated by mouse move)
                    onAddDrawing(currentDrawing);
                    setCurrentDrawing(null);
                    onDrawingComplete();
                    return;
                }

                if (newPoints.length === targetPoints) {
                    // Finished
                    const finalDrawing = { ...currentDrawing, points: newPoints };
                    onAddDrawing(finalDrawing);
                    setCurrentDrawing(null);
                    onDrawingComplete();
                } else {
                    // Add next preview point
                    setCurrentDrawing({ ...currentDrawing, points: [...newPoints, point] });
                }
            }
            return;
        }

        // 2. Selection / Interaction Mode (No active tool)

        // Check for anchor click (Resize)
        if (selectedDrawingId) {
            const selectedDrawing = drawings.find(d => d.id === selectedDrawingId);
            if (selectedDrawing) {
                for (let i = 0; i < selectedDrawing.points.length; i++) {
                    const p = selectedDrawing.points[i];
                    const px = timeToX(p.time);
                    const py = priceToY(p.price);
                    if (getDistance({ x, y }, { x: px, y: py }) <= 8) {
                        setDragMode('resize');
                        setActiveAnchorIndex(i);
                        setDragStartPoint({ x, y });
                        return;
                    }
                }
            }
        }

        // Check for drawing click (Select / Move)
        // Iterate in reverse to select top-most
        for (let i = drawings.length - 1; i >= 0; i--) {
            const d = drawings[i];
            let isHit = false;

            if (d.type === 'trend-line' || d.type === 'fibonacci') {
                if (d.points.length >= 2) {
                    const p1 = { x: timeToX(d.points[0].time), y: priceToY(d.points[0].price) };
                    const p2 = { x: timeToX(d.points[1].time), y: priceToY(d.points[1].price) };
                    if (isPointNearLine({ x, y }, p1, p2)) isHit = true;
                }
            } else if (d.type === 'horizontal-line') {
                const py = priceToY(d.points[0].price);
                if (Math.abs(y - py) <= 5) isHit = true;
            } else if (d.type === 'rectangle') {
                if (d.points.length >= 2) {
                    const p1 = { x: timeToX(d.points[0].time), y: priceToY(d.points[0].price) };
                    const p2 = { x: timeToX(d.points[1].time), y: priceToY(d.points[1].price) };
                    if (isPointInRect({ x, y }, p1, p2)) isHit = true;
                }
            } else if (d.type === 'text' || d.type === 'icon') {
                const px = timeToX(d.points[0].time);
                const py = priceToY(d.points[0].price);
                // Simple bounding box approx
                if (x >= px && x <= px + 50 && y >= py - 20 && y <= py) isHit = true;
            } else if (d.type === 'brush') {
                for (let j = 0; j < d.points.length - 1; j++) {
                    const p1 = { x: timeToX(d.points[j].time), y: priceToY(d.points[j].price) };
                    const p2 = { x: timeToX(d.points[j + 1].time), y: priceToY(d.points[j + 1].price) };
                    if (isPointNearLine({ x, y }, p1, p2)) {
                        isHit = true;
                        break;
                    }
                }
            }

            if (isHit) {
                setSelectedDrawingId(d.id);
                setDragMode('move');
                setDragStartPoint({ x, y });
                return;
            }
        }

        // Clicked empty space
        setSelectedDrawingId(null);
        setContextMenu(null);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('Right click detected');
        if (!chart || !series) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log('Click coords:', x, y);

        // Check if right-click is on a drawing
        for (let i = drawings.length - 1; i >= 0; i--) {
            const d = drawings[i];
            let isHit = false;

            if (d.type === 'trend-line' || d.type === 'fibonacci') {
                if (d.points.length >= 2) {
                    const p1 = { x: timeToX(d.points[0].time), y: priceToY(d.points[0].price) };
                    const p2 = { x: timeToX(d.points[1].time), y: priceToY(d.points[1].price) };
                    if (isPointNearLine({ x, y }, p1, p2)) isHit = true;
                }
            } else if (d.type === 'horizontal-line') {
                const py = priceToY(d.points[0].price);
                if (Math.abs(y - py) <= 5) isHit = true;
            } else if (d.type === 'rectangle') {
                if (d.points.length >= 2) {
                    const p1 = { x: timeToX(d.points[0].time), y: priceToY(d.points[0].price) };
                    const p2 = { x: timeToX(d.points[1].time), y: priceToY(d.points[1].price) };
                    if (isPointInRect({ x, y }, p1, p2)) isHit = true;
                }
            } else if (d.type === 'text' || d.type === 'icon') {
                const px = timeToX(d.points[0].time);
                const py = priceToY(d.points[0].price);
                if (x >= px && x <= px + 50 && y >= py - 20 && y <= py) isHit = true;
            } else if (d.type === 'brush') {
                for (let j = 0; j < d.points.length - 1; j++) {
                    const p1 = { x: timeToX(d.points[j].time), y: priceToY(d.points[j].price) };
                    const p2 = { x: timeToX(d.points[j + 1].time), y: priceToY(d.points[j + 1].price) };
                    if (isPointNearLine({ x, y }, p1, p2)) {
                        isHit = true;
                        break;
                    }
                }
            } else if (d.type === 'long-position' || d.type === 'short-position') {
                if (d.points.length >= 3) {
                    const entry = { x: timeToX(d.points[0].time), y: priceToY(d.points[0].price) };
                    const tp = { x: timeToX(d.points[1].time), y: priceToY(d.points[1].price) };
                    const sl = { x: timeToX(d.points[2].time), y: priceToY(d.points[2].price) };

                    // Determine width from the furthest point (TP or SL)
                    const maxX = Math.max(tp.x, sl.x);
                    const width = Math.max(50, maxX - entry.x); // Minimum width 50px

                    // Check Profit Rect
                    const pRect = {
                        x: entry.x,
                        y: Math.min(entry.y, tp.y),
                        width: width,
                        height: Math.abs(entry.y - tp.y)
                    };
                    // Check Loss Rect
                    const lRect = {
                        x: entry.x,
                        y: Math.min(entry.y, sl.y),
                        width: width,
                        height: Math.abs(entry.y - sl.y)
                    };

                    if (x >= pRect.x && x <= pRect.x + pRect.width && y >= pRect.y && y <= pRect.y + pRect.height) isHit = true;
                    if (x >= lRect.x && x <= lRect.x + lRect.width && y >= lRect.y && y <= lRect.y + lRect.height) isHit = true;

                    if (isHit) {
                        console.log('Long/Short Hit!', { d, x, y, pRect, lRect });
                    }
                }
            } else if (d.type === 'elliott-wave') {
                for (let j = 0; j < d.points.length - 1; j++) {
                    const p1 = { x: timeToX(d.points[j].time), y: priceToY(d.points[j].price) };
                    const p2 = { x: timeToX(d.points[j + 1].time), y: priceToY(d.points[j + 1].price) };
                    if (isPointNearLine({ x, y }, p1, p2)) {
                        isHit = true;
                        break;
                    }
                }
            } else if (d.type === 'pitchfork') {
                if (d.points.length >= 3) {
                    const p1 = { x: timeToX(d.points[0].time), y: priceToY(d.points[0].price) };
                    const p2 = { x: timeToX(d.points[1].time), y: priceToY(d.points[1].price) };
                    const p3 = { x: timeToX(d.points[2].time), y: priceToY(d.points[2].price) };

                    // Calculate ends (simplified for hit test)
                    const midX = (p2.x + p3.x) / 2;
                    const midY = (p2.y + p3.y) / 2;
                    const dx = midX - p1.x;
                    const dy = midY - p1.y;
                    const extension = 1000;
                    const ratio = extension / (Math.sqrt(dx * dx + dy * dy) || 1);
                    const ex = dx * ratio;
                    const ey = dy * ratio;

                    const mEnd = { x: p1.x + ex, y: p1.y + ey };
                    const uEnd = { x: p2.x + ex, y: p2.y + ey };
                    const lEnd = { x: p3.x + ex, y: p3.y + ey };

                    if (isPointNearLine({ x, y }, p1, mEnd)) isHit = true;
                    if (isPointNearLine({ x, y }, p2, uEnd)) isHit = true;
                    if (isPointNearLine({ x, y }, p3, lEnd)) isHit = true;
                    if (isPointNearLine({ x, y }, p2, p3)) isHit = true;
                }
            }

            if (isHit) {
                console.log('Hit drawing:', d.id);
                setSelectedDrawingId(d.id);
                setContextMenu({ x: e.clientX, y: e.clientY, drawingId: d.id });
                return;
            }
        }
        console.log('No hit');
        setContextMenu(null);
    };

    const handleCopyDrawing = () => {
        if (!contextMenu) return;
        const drawing = drawings.find(d => d.id === contextMenu.drawingId);
        if (!drawing) return;

        // Create deep copy with new ID and slight offset
        // Offset logic is tricky with time/price.
        // Let's just offset by a small pixel amount converted to time/price?
        // Or just duplicate in place? User can move it.
        // Let's duplicate in place for simplicity, maybe user will drag it.
        // Actually, offset is better visibility.

        // Simple offset: add small amount to price?
        // Price scale varies.
        // Let's just duplicate.

        const newDrawing: Drawing = {
            ...drawing,
            id: generateId(),
            points: drawing.points.map(p => ({ ...p })) // Deep copy points
        };

        // Slight offset if possible?
        // Let's try to offset by 10 pixels in X and Y
        // Slight offset if possible?
        // Let's try to offset by 10 pixels in X and Y
        // For now, duplicate in place.

        onAddDrawing(newDrawing);
        setContextMenu(null);
    };

    const handleDeleteContext = () => {
        if (!contextMenu) return;
        onDeleteDrawing(contextMenu.drawingId);
        setContextMenu(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!chart || !series) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let point = coordinateToPoint(x, y);
        if (!point) return;

        if (isMagnetMode && (activeTool || dragMode)) {
            point = snapToCandle(point);
        }

        // Drawing Mode
        if (activeTool && currentDrawing) {
            if (activeTool === 'brush') {
                // Add point if distance is enough (optimization)
                const lastPoint = currentDrawing.points[currentDrawing.points.length - 1];
                const lastX = timeToX(lastPoint.time);
                const lastY = priceToY(lastPoint.price);
                if (getDistance({ x, y }, { x: lastX, y: lastY }) > 5) {
                    setCurrentDrawing({ ...currentDrawing, points: [...currentDrawing.points, point] });
                }
            } else if (activeTool === 'long-position' || activeTool === 'short-position') {
                const entry = currentDrawing.points[0];
                const dy = point.price - entry.price;

                let tpPrice, slPrice;

                if (activeTool === 'long-position') {
                    if (point.price > entry.price) {
                        tpPrice = point.price;
                        slPrice = entry.price - dy;
                    } else {
                        slPrice = point.price;
                        tpPrice = entry.price - dy;
                    }
                } else { // short-position
                    if (point.price < entry.price) {
                        tpPrice = point.price;
                        slPrice = entry.price - dy;
                    } else {
                        slPrice = point.price;
                        tpPrice = entry.price - dy;
                    }
                }

                const newPoints = [
                    entry,
                    { time: point.time, price: tpPrice },
                    { time: point.time, price: slPrice }
                ];
                setCurrentDrawing({ ...currentDrawing, points: newPoints });

            } else {
                // Standard update for all tools (update last point)
                // This works for 2-point tools and multi-point tools (updating preview)
                const newPoints = [...currentDrawing.points];
                newPoints[newPoints.length - 1] = point;
                setCurrentDrawing({ ...currentDrawing, points: newPoints });
            }
        }

        // Dragging Mode
        if (dragMode && selectedDrawingId && dragStartPoint) {
            // ... (existing drag logic is fine)

            const selectedDrawing = drawings.find(d => d.id === selectedDrawingId);
            if (!selectedDrawing) return;

            if (dragMode === 'move') {
                // Calculate delta based on mouse position change in Time/Price coordinates
                // This avoids issues where drawing points are off-screen and coordinateToPoint returns null
                const startPoint = coordinateToPoint(dragStartPoint.x, dragStartPoint.y);
                const currentPoint = coordinateToPoint(x, y);

                if (startPoint && currentPoint) {
                    const dTime = currentPoint.time - startPoint.time;
                    const dPrice = currentPoint.price - startPoint.price;

                    const newPoints = selectedDrawing.points.map(p => ({
                        time: p.time + dTime,
                        price: p.price + dPrice
                    }));

                    onUpdateDrawing({ ...selectedDrawing, points: newPoints });
                    setDragStartPoint({ x, y }); // Reset start point for incremental updates
                }
            } else if (dragMode === 'resize' && activeAnchorIndex !== null) {
                const newPoints = [...selectedDrawing.points];
                newPoints[activeAnchorIndex] = point;
                onUpdateDrawing({ ...selectedDrawing, points: newPoints });
            }
        }
    };

    const handleMouseUp = () => {
        if (activeTool === 'brush' && currentDrawing) {
            onAddDrawing(currentDrawing);
            setCurrentDrawing(null);
            onDrawingComplete();
        }
        setDragMode(null);
        setDragStartPoint(null);
        setActiveAnchorIndex(null);
    };

    // Keyboard deletion
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
                onDeleteDrawing(selectedDrawingId);
                setSelectedDrawingId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDrawingId, onDeleteDrawing]);

    // Render helpers
    const renderDrawing = (d: Drawing, isPreview = false) => {
        if (d.points.length === 0) return null;
        const p1 = d.points[0];
        const x1 = timeToX(p1.time);
        const y1 = priceToY(p1.price);

        if (d.type === 'horizontal-line') {
            return (
                <line
                    key={d.id}
                    x1={0} y1={y1} x2={width} y2={y1}
                    stroke={d.properties?.color}
                    strokeWidth={d.properties?.lineWidth}
                    strokeDasharray={isPreview ? "5,5" : ""}
                />
            );
        }

        if (d.points.length < 2) return null;
        const p2 = d.points[1];
        const x2 = timeToX(p2.time);
        const y2 = priceToY(p2.price);

        if (d.type === 'trend-line') {
            return (
                <line
                    key={d.id}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={d.properties?.color}
                    strokeWidth={d.properties?.lineWidth}
                />
            );
        }

        if (d.type === 'rectangle') {
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.abs(x2 - x1);
            const rh = Math.abs(y2 - y1);
            return (
                <rect
                    key={d.id}
                    x={rx} y={ry} width={rw} height={rh}
                    stroke={d.properties?.color}
                    strokeWidth={d.properties?.lineWidth}
                    fill={d.properties?.color}
                    fillOpacity={0.2}
                />
            );
        }

        if (d.type === 'fibonacci') {
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const priceDiff = p2.price - p1.price;

            return (
                <g key={d.id}>
                    {/* Main trend line */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={d.properties?.color} strokeWidth={1} strokeDasharray="3,3" />
                    {levels.map(level => {
                        const levelPrice = p1.price + (priceDiff * level);
                        const ly = priceToY(levelPrice);
                        return (
                            <line
                                key={`${d.id}-${level}`}
                                x1={Math.min(x1, x2)} y1={ly} x2={Math.max(x1, x2)} y2={ly}
                                stroke={d.properties?.color}
                                strokeWidth={1}
                            />
                        );
                    })}
                </g>
            );
        }

        if (d.type === 'text') {
            return (
                <text
                    key={d.id}
                    x={x1} y={y1}
                    fill={d.properties?.color || '#d1d4dc'}
                    fontSize="14px"
                    fontFamily="sans-serif"
                >
                    {d.properties?.text || 'Text'}
                </text>
            );
        }

        if (d.type === 'icon') {
            return (
                <text
                    key={d.id}
                    x={x1} y={y1}
                    fill={d.properties?.color || '#d1d4dc'}
                    fontSize="20px"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    ☺
                </text>
            );
        }

        if (d.type === 'measure') {
            const width = x2 - x1;
            const height = y2 - y1;
            const priceDiff = p2.price - p1.price;
            const percentChange = (priceDiff / p1.price) * 100;

            // Calculate bar count
            let barCount = 0;
            if (data && data.length > 0) {
                const t1 = p1.time;
                const t2 = p2.time;
                const idx1 = data.findIndex(item => item.time === t1);
                const idx2 = data.findIndex(item => item.time === t2);

                if (idx1 !== -1 && idx2 !== -1) {
                    barCount = Math.abs(idx2 - idx1);
                }
            }

            return (
                <g key={d.id}>
                    <rect
                        x={Math.min(x1, x2)}
                        y={Math.min(y1, y2)}
                        width={Math.abs(width)}
                        height={Math.abs(height)}
                        fill="rgba(33, 150, 243, 0.1)"
                        stroke="#2196f3"
                        strokeWidth={1}
                        strokeDasharray="5,5"
                    />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2196f3" strokeWidth={1} />

                    {/* Info Box */}
                    <g transform={`translate(${x2 + 10}, ${y2})`}>
                        <rect x={0} y={-30} width={120} height={60} fill="#1e222d" stroke="#2a2e39" rx={4} />
                        <text x={10} y={-15} fill="#d1d4dc" fontSize="11px" fontFamily="monospace">
                            {priceDiff.toFixed(2)} ({percentChange.toFixed(2)}%)
                        </text>
                        <text x={10} y={5} fill="#d1d4dc" fontSize="11px" fontFamily="monospace">
                            {barCount} bars
                        </text>
                        <text x={10} y={20} fill="#d1d4dc" fontSize="11px" fontFamily="monospace">
                            {(p2.price).toFixed(2)}
                        </text>
                    </g>
                </g>
            );
        }

        if (d.type === 'brush') {
            const points = d.points.map(p => `${timeToX(p.time)},${priceToY(p.price)}`).join(' ');
            return (
                <polyline
                    key={d.id}
                    points={points}
                    fill="none"
                    stroke={d.properties?.color}
                    strokeWidth={d.properties?.lineWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            );
        }

        if (d.type === 'elliott-wave') {
            const points = d.points.map(p => ({ x: timeToX(p.time), y: priceToY(p.price) }));
            return (
                <g key={d.id}>
                    <polyline
                        points={points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={d.properties?.color}
                        strokeWidth={d.properties?.lineWidth}
                    />
                    {points.map((p, i) => (
                        <text
                            key={i}
                            x={p.x}
                            y={p.y - 10}
                            fill={d.properties?.color}
                            fontSize="12px"
                            textAnchor="middle"
                            fontWeight="bold"
                        >
                            {i + 1}
                        </text>
                    ))}
                </g>
            );
        }

        if (d.type === 'pitchfork') {
            const points = d.points.map(p => ({ x: timeToX(p.time), y: priceToY(p.price) }));
            if (points.length < 2) return null;

            const p1 = points[0];
            const p2 = points[1];
            const p3 = points[2] || p2;

            const midX = (p2.x + p3.x) / 2;
            const midY = (p2.y + p3.y) / 2;

            const dx = midX - p1.x;
            const dy = midY - p1.y;

            const extension = 10000;
            const ratio = extension / (Math.sqrt(dx * dx + dy * dy) || 1);

            const ex = dx * ratio;
            const ey = dy * ratio;

            const mEnd = { x: p1.x + ex, y: p1.y + ey };
            const uEnd = { x: p2.x + ex, y: p2.y + ey };
            const lEnd = { x: p3.x + ex, y: p3.y + ey };

            return (
                <g key={d.id}>
                    <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke={d.properties?.color} strokeWidth={1} strokeDasharray="3,3" />
                    <line x1={p1.x} y1={p1.y} x2={mEnd.x} y2={mEnd.y} stroke={d.properties?.color} strokeWidth={d.properties?.lineWidth} />
                    <line x1={p2.x} y1={p2.y} x2={uEnd.x} y2={uEnd.y} stroke={d.properties?.color} strokeWidth={d.properties?.lineWidth} />
                    <line x1={p3.x} y1={p3.y} x2={lEnd.x} y2={lEnd.y} stroke={d.properties?.color} strokeWidth={d.properties?.lineWidth} />
                    <path d={`M ${p2.x} ${p2.y} L ${uEnd.x} ${uEnd.y} L ${lEnd.x} ${lEnd.y} L ${p3.x} ${p3.y} Z`} fill={d.properties?.color} fillOpacity={0.1} stroke="none" />
                </g>
            );
        }

        if (d.type === 'long-position' || d.type === 'short-position') {
            const points = d.points.map(p => ({ x: timeToX(p.time), y: priceToY(p.price) }));
            if (points.length < 3) return null;

            const entry = points[0];
            const tp = points[1];
            const sl = points[2];

            const x1 = entry.x;
            // Determine width from the furthest point (TP or SL)
            const maxX = Math.max(tp.x, sl.x);
            const width = Math.max(50, maxX - x1); // Minimum width 50px
            const x2 = x1 + width;

            const profitColor = 'rgba(76, 175, 80, 0.2)';
            const lossColor = 'rgba(244, 67, 54, 0.2)';
            const profitStroke = '#4caf50';
            const lossStroke = '#f44336';

            const entryPrice = d.points[0].price;
            const tpPrice = d.points[1].price;
            const slPrice = d.points[2].price;

            const risk = Math.abs(entryPrice - slPrice);
            const reward = Math.abs(entryPrice - tpPrice);
            const ratio = risk === 0 ? 0 : reward / risk;

            return (
                <g key={d.id}>
                    <rect
                        x={x1}
                        y={Math.min(entry.y, tp.y)}
                        width={width}
                        height={Math.abs(entry.y - tp.y)}
                        fill={profitColor}
                        stroke={profitStroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={x1}
                        y={Math.min(entry.y, sl.y)}
                        width={width}
                        height={Math.abs(entry.y - sl.y)}
                        fill={lossColor}
                        stroke={lossStroke}
                        strokeWidth={1}
                    />
                    <line x1={x1} y1={entry.y} x2={x2} y2={entry.y} stroke="#787b86" strokeWidth={1} strokeDasharray="3,3" />
                    <text x={x2 + 5} y={tp.y} fill={profitStroke} fontSize="11px" dominantBaseline="middle">
                        TP: {tpPrice.toFixed(2)} ({((tpPrice - entryPrice) / entryPrice * 100).toFixed(2)}%)
                    </text>
                    <text x={x2 + 5} y={sl.y} fill={lossStroke} fontSize="11px" dominantBaseline="middle">
                        SL: {slPrice.toFixed(2)} ({((slPrice - entryPrice) / entryPrice * 100).toFixed(2)}%)
                    </text>
                    <text x={x2 + 5} y={entry.y} fill="#787b86" fontSize="11px" dominantBaseline="middle">
                        Risk/Reward: {ratio.toFixed(2)}
                    </text>
                </g>
            );
        }

        return null;
    };

    const renderAnchors = (d: Drawing) => {
        if (d.id !== selectedDrawingId) return null;
        return d.points.map((p, i) => {
            const x = timeToX(p.time);
            const y = priceToY(p.price);
            return (
                <circle
                    key={`anchor-${i}`}
                    cx={x} cy={y} r={5}
                    fill="white" stroke="#2962ff" strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                />
            );
        });
    };

    return (
        <>
            <svg
                ref={svgRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: activeTool ? 'auto' : 'none', // Only capture if drawing
                    zIndex: 20
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={handleContextMenu}
            >
                {drawings.map(d => (
                    <g key={d.id} style={{ pointerEvents: 'auto' }}> {/* Allow interaction with drawings */}
                        {renderDrawing(d)}
                        {renderAnchors(d)}
                    </g>
                ))}
                {currentDrawing && (
                    <g style={{ pointerEvents: 'none' }}>
                        {renderDrawing(currentDrawing, true)}
                    </g>
                )}
            </svg>

            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        backgroundColor: '#1e222d',
                        border: '1px solid #2a2e39',
                        borderRadius: '4px',
                        padding: '4px 0',
                        zIndex: 1000,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: '#d1d4dc',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onClick={handleCopyDrawing}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2e39'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <span>Copy</span>
                    </div>
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: '#f44336',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onClick={handleDeleteContext}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2e39'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <span>Delete</span>
                    </div>
                </div>
            )}
        </>
    );
};
