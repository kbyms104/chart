import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import type { DataPoint } from '../types';
import type { ChartSettings } from './SettingsMenu';
import { TVLegend } from './TVLegend';
import { DrawingOverlay } from './DrawingOverlay';
import type { Drawing, DrawingType } from '../utils/drawingUtils';
import { IchimokuCloudSeries } from './IchimokuCloudSeries';

interface Props {
    data: DataPoint[];
    visibleSeries: Record<string, boolean>;
    chartSettings: ChartSettings;
    activeTool: DrawingType | null;
    isMagnetMode: boolean;
    onDeleteDrawing: (id: string) => void;
    onDrawingComplete: () => void;
    onLoadMoreHistory?: () => void;
}

export const TradingViewChart: React.FC<Props> = ({ data, visibleSeries, chartSettings, activeTool, isMagnetMode, onDeleteDrawing, onDrawingComplete, onLoadMoreHistory }) => {
    console.log("TradingViewChart v5 Loaded - Force Update");
    const containerRef = useRef<HTMLDivElement>(null);
    const mainChartContainerRef = useRef<HTMLDivElement>(null);
    const rsiChartContainerRef = useRef<HTMLDivElement>(null);
    const macdChartContainerRef = useRef<HTMLDivElement>(null);
    const stochChartContainerRef = useRef<HTMLDivElement>(null);
    const atrChartContainerRef = useRef<HTMLDivElement>(null);
    const adxChartContainerRef = useRef<HTMLDivElement>(null);

    const chartsRef = useRef<{
        main?: IChartApi;
        rsi?: IChartApi;
        macd?: IChartApi;
        stoch?: IChartApi;
        atr?: IChartApi;
        adx?: IChartApi;
    }>({});
    const seriesRef = useRef<any>({});
    const cloudSeriesRef = useRef<any>(null);
    const dataRef = useRef<DataPoint[]>([]);

    const [drawings, setDrawings] = useState<Drawing[]>([]);

    const handleAddDrawing = (drawing: Drawing) => {
        setDrawings(prev => [...prev, drawing]);
    };

    const handleUpdateDrawing = (drawing: Drawing) => {
        setDrawings(prev => prev.map(d => d.id === drawing.id ? drawing : d));
    };

    const handleDeleteDrawing = (id: string) => {
        setDrawings(prev => prev.filter(d => d.id !== id));
        onDeleteDrawing(id);
    };

    // Legend state
    const [legendData, setLegendData] = useState<{
        ohlc: { open: number; high: number; low: number; close: number } | null;
        indicators: { name: string; value: number | undefined; color: string }[];
    }>({ ohlc: null, indicators: [] });


    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

    const updateChartData = React.useCallback((currentData: DataPoint[]) => {

        console.log('updateChartData called with', currentData.length, 'points');
        if (!chartsRef.current.main || currentData.length === 0) {
            console.log('Skipping update: main chart not ready or no data');
            return;
        }

        // --- Data Processing ---
        const uniqueDataMap = new Map();
        currentData.forEach(d => {
            const time = Math.floor(d.time as number / 1000) as any;
            if (!uniqueDataMap.has(time)) {
                uniqueDataMap.set(time, {
                    ...d,
                    time: time,
                });
            }
        });

        let formattedData = Array.from(uniqueDataMap.values());
        formattedData.sort((a, b) => (a.time as number) - (b.time as number));

        console.log('Formatted data length:', formattedData.length);

        if (formattedData.length > 0) {
            if (seriesRef.current['main']) {
                seriesRef.current['main'].setData(formattedData);
            } else {
                console.warn('Main series not found in seriesRef');
            }

            if (seriesRef.current['volume']) seriesRef.current['volume'].setData(formattedData.map((d: any) => ({ time: d.time, value: d.volume || 0, color: d.close >= d.open ? '#26a69a' : '#ef5350' })));

            if (seriesRef.current['sma-20']) seriesRef.current['sma-20'].setData(formattedData.filter((d: any) => d.sma20 !== undefined && !isNaN(d.sma20)).map((d: any) => ({ time: d.time, value: d.sma20 })));
            if (seriesRef.current['ema-20']) seriesRef.current['ema-20'].setData(formattedData.filter((d: any) => d.ema20 !== undefined && !isNaN(d.ema20)).map((d: any) => ({ time: d.time, value: d.ema20 })));
            if (seriesRef.current['bb-upper']) seriesRef.current['bb-upper'].setData(formattedData.filter((d: any) => d.bb_upper !== undefined && !isNaN(d.bb_upper)).map((d: any) => ({ time: d.time, value: d.bb_upper })));
            if (seriesRef.current['bb-lower']) seriesRef.current['bb-lower'].setData(formattedData.filter((d: any) => d.bb_lower !== undefined && !isNaN(d.bb_lower)).map((d: any) => ({ time: d.time, value: d.bb_lower })));

            if (seriesRef.current['rsi']) {
                seriesRef.current['rsi'].setData(formattedData.map((d: any) => {
                    if (d.rsi !== undefined && !isNaN(d.rsi)) return { time: d.time, value: d.rsi };
                    return { time: d.time } as any;
                }));
            }

            if (seriesRef.current['macd-line']) {
                seriesRef.current['macd-line'].setData(formattedData.map((d: any) => {
                    if (d.macd_line !== undefined && !isNaN(d.macd_line)) return { time: d.time, value: d.macd_line };
                    return { time: d.time } as any;
                }));
                seriesRef.current['macd-signal'].setData(formattedData.map((d: any) => {
                    if (d.macd_signal !== undefined && !isNaN(d.macd_signal)) return { time: d.time, value: d.macd_signal };
                    return { time: d.time } as any;
                }));
                seriesRef.current['macd-hist'].setData(formattedData.map((d: any) => {
                    if (d.macd_hist !== undefined && !isNaN(d.macd_hist)) return { time: d.time, value: d.macd_hist, color: (d.macd_hist || 0) >= 0 ? '#26a69a' : '#ef5350' };
                    return { time: d.time } as any;
                }));
            }

            if (seriesRef.current['stoch-k']) {
                seriesRef.current['stoch-k'].setData(formattedData.map((d: any) => {
                    if (d.stoch_k !== undefined && !isNaN(d.stoch_k)) return { time: d.time, value: d.stoch_k };
                    return { time: d.time } as any;
                }));
                seriesRef.current['stoch-d'].setData(formattedData.map((d: any) => {
                    if (d.stoch_d !== undefined && !isNaN(d.stoch_d)) return { time: d.time, value: d.stoch_d };
                    return { time: d.time } as any;
                }));
            }

            if (seriesRef.current['atr']) {
                seriesRef.current['atr'].setData(formattedData.map((d: any) => {
                    if (d.atr !== undefined && !isNaN(d.atr)) return { time: d.time, value: d.atr };
                    return { time: d.time } as any;
                }));
            }

            if (seriesRef.current['adx']) {
                seriesRef.current['adx'].setData(formattedData.map((d: any) => {
                    if (d.adx !== undefined && !isNaN(d.adx)) return { time: d.time, value: d.adx };
                    return { time: d.time } as any;
                }));
                seriesRef.current['di-plus'].setData(formattedData.map((d: any) => {
                    if (d.di_plus !== undefined && !isNaN(d.di_plus)) return { time: d.time, value: d.di_plus };
                    return { time: d.time } as any;
                }));
                seriesRef.current['di-minus'].setData(formattedData.map((d: any) => {
                    if (d.di_minus !== undefined && !isNaN(d.di_minus)) return { time: d.time, value: d.di_minus };
                    return { time: d.time } as any;
                }));
            }

            if (cloudSeriesRef.current) {
                cloudSeriesRef.current.setData(formattedData.filter((d: any) =>
                    d.senkou_span_a !== undefined && !isNaN(d.senkou_span_a) &&
                    d.senkou_span_b !== undefined && !isNaN(d.senkou_span_b)
                ).map((d: any) => ({
                    time: d.time,
                    spanA: d.senkou_span_a,
                    spanB: d.senkou_span_b
                })));
            }

            if (seriesRef.current['tenkan']) seriesRef.current['tenkan'].setData(formattedData.filter((d: any) => d.tenkan_sen !== undefined && !isNaN(d.tenkan_sen)).map((d: any) => ({ time: d.time, value: d.tenkan_sen })));
            if (seriesRef.current['kijun']) seriesRef.current['kijun'].setData(formattedData.filter((d: any) => d.kijun_sen !== undefined && !isNaN(d.kijun_sen)).map((d: any) => ({ time: d.time, value: d.kijun_sen })));
            if (seriesRef.current['spanA']) seriesRef.current['spanA'].setData(formattedData.filter((d: any) => d.senkou_span_a !== undefined && !isNaN(d.senkou_span_a)).map((d: any) => ({ time: d.time, value: d.senkou_span_a })));
            if (seriesRef.current['spanB']) seriesRef.current['spanB'].setData(formattedData.filter((d: any) => d.senkou_span_b !== undefined && !isNaN(d.senkou_span_b)).map((d: any) => ({ time: d.time, value: d.senkou_span_b })));
            if (seriesRef.current['chikou']) seriesRef.current['chikou'].setData(formattedData.filter((d: any) => d.chikou_span !== undefined && !isNaN(d.chikou_span)).map((d: any) => ({ time: d.time, value: d.chikou_span })));
            if (seriesRef.current['sar']) seriesRef.current['sar'].setData(formattedData.filter((d: any) => d.sar !== undefined && !isNaN(d.sar)).map((d: any) => ({ time: d.time, value: d.sar })));
        }

        // Store data reference for legend lookup
        dataRef.current = currentData;

    }, []);

    useEffect(() => {
        if (!mainChartContainerRef.current) return;


        console.time('ChartInitialization');

        // Cleanup previous charts
        if (chartsRef.current.main) { chartsRef.current.main.remove(); chartsRef.current.main = undefined; }
        if (chartsRef.current.rsi) { chartsRef.current.rsi.remove(); chartsRef.current.rsi = undefined; }
        if (chartsRef.current.macd) { chartsRef.current.macd.remove(); chartsRef.current.macd = undefined; }
        if (chartsRef.current.stoch) { chartsRef.current.stoch.remove(); chartsRef.current.stoch = undefined; }
        if (chartsRef.current.atr) { chartsRef.current.atr.remove(); chartsRef.current.atr = undefined; }
        if (chartsRef.current.adx) { chartsRef.current.adx.remove(); chartsRef.current.adx = undefined; }

        seriesRef.current = {};

        // --- 1. Main Chart ---
        const mainChart = createChart(mainChartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
            grid: {
                vertLines: { color: chartSettings.showGrid ? '#2a2e39' : 'transparent' },
                horzLines: { color: chartSettings.showGrid ? '#2a2e39' : 'transparent' }
            },
            timeScale: {
                borderColor: '#2a2e39',
                timeVisible: true,
                rightOffset: 5,
            },
            rightPriceScale: {
                borderColor: '#2a2e39',
            },
            crosshair: {
                horzLine: { labelVisible: chartSettings.showCrosshairLabels },
                vertLine: { labelVisible: chartSettings.showCrosshairLabels }
            },
            width: mainChartContainerRef.current.clientWidth || 600,
            height: mainChartContainerRef.current.clientHeight || 400,
        });
        chartsRef.current.main = mainChart;

        const candleSeries = mainChart.addSeries(CandlestickSeries, {
            upColor: '#089981', downColor: '#f23645', borderVisible: false, wickUpColor: '#089981', wickDownColor: '#f23645',
            lastValueVisible: chartSettings.showLastPriceLabel,
            priceLineVisible: chartSettings.showLastPriceLabel,
            visible: true,
        });
        seriesRef.current['main'] = candleSeries;

        const volumeSeries = mainChart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Overlay
            visible: chartSettings.showVolume,
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });
        seriesRef.current['volume'] = volumeSeries;

        const smaSeries = mainChart.addSeries(LineSeries, { color: '#f7525f', lineWidth: 2, visible: false, lastValueVisible: chartSettings.showIndicatorPriceLabels });
        seriesRef.current['sma-20'] = smaSeries;
        const emaSeries = mainChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2, visible: false, lastValueVisible: chartSettings.showIndicatorPriceLabels });
        seriesRef.current['ema-20'] = emaSeries;
        const bbUpperSeries = mainChart.addSeries(LineSeries, { color: '#22ab94', lineWidth: 1, visible: false, lastValueVisible: chartSettings.showIndicatorPriceLabels });
        seriesRef.current['bb-upper'] = bbUpperSeries;
        const bbLowerSeries = mainChart.addSeries(LineSeries, { color: '#22ab94', lineWidth: 1, visible: false, lastValueVisible: chartSettings.showIndicatorPriceLabels });
        seriesRef.current['bb-lower'] = bbLowerSeries;

        // Ichimoku Cloud
        const cloudSeries = mainChart.addCustomSeries(new IchimokuCloudSeries(), {
            bullishColor: 'rgba(76, 175, 80, 0.2)',
            bearishColor: 'rgba(244, 67, 54, 0.2)',
            visible: false,
        } as any);
        cloudSeriesRef.current = cloudSeries;

        const tenkanSeries = mainChart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1, visible: false, lastValueVisible: chartSettings.showIndicatorPriceLabels });
        seriesRef.current['tenkan'] = tenkanSeries;
        const kijunSeries = mainChart.addSeries(LineSeries, { color: '#b71c1c', lineWidth: 1, visible: false, lastValueVisible: chartSettings.showIndicatorPriceLabels });
        seriesRef.current['kijun'] = kijunSeries;
        const spanASeries = mainChart.addSeries(LineSeries, { color: '#4caf50', lineWidth: 1, visible: false, lastValueVisible: false });
        seriesRef.current['spanA'] = spanASeries;
        const spanBSeries = mainChart.addSeries(LineSeries, { color: '#f44336', lineWidth: 1, visible: false, lastValueVisible: false });
        seriesRef.current['spanB'] = spanBSeries;
        const chikouSeries = mainChart.addSeries(LineSeries, { color: '#3f51b5', lineWidth: 1, visible: false, lastValueVisible: false });
        seriesRef.current['chikou'] = chikouSeries;

        // Parabolic SAR
        // SAR is usually dots, but Lightweight Charts doesn't have "dots" series type easily without custom series or using markers.
        // We can use LineSeries with cross/point style if available, or just LineSeries with 0 width and markers?
        // Or just a line for now.
        // Actually, we can use a LineSeries with style: 2 (Dashed) or just points.
        // Let's use LineSeries with crosshair marker style? No.
        // Let's use a LineSeries with style: 3 (Large Dots? No).
        // Let's use LineSeries for now, maybe with specific style.
        const sarSeries = mainChart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 1, crosshairMarkerVisible: true, lastValueVisible: chartSettings.showIndicatorPriceLabels, visible: false });
        // To make it look like dots, we might need to use markers, but markers are for events.
        // Let's just use a line for now.
        seriesRef.current['sar'] = sarSeries;







        // --- Initial Visibility ---
        smaSeries.applyOptions({ visible: visibleSeries['sma-20'] });
        emaSeries.applyOptions({ visible: visibleSeries['ema-20'] });
        bbUpperSeries.applyOptions({ visible: visibleSeries['bb'] });
        bbLowerSeries.applyOptions({ visible: visibleSeries['bb'] });

        // Store data reference for legend lookup
        dataRef.current = data;

        // --- Crosshair Move (for Legend) ---
        mainChart.subscribeCrosshairMove((param) => {
            if (!param.time || param.seriesData.size === 0) {
                setLegendData({ ohlc: null, indicators: [] });
                return;
            }

            // Find the data point for the hovered time
            const timeValue = param.time as number;
            const hoveredData = data.find(d => Math.floor(d.time as number / 1000) === timeValue);

            if (hoveredData) {
                setLegendData({
                    ohlc: { open: hoveredData.open, high: hoveredData.high, low: hoveredData.low, close: hoveredData.close },
                    indicators: [
                        visibleSeries['sma-20'] ? { name: 'SMA 20', value: hoveredData.sma20, color: '#f7525f' } : null,
                        visibleSeries['ema-20'] ? { name: 'EMA 20', value: hoveredData.ema20, color: '#2962ff' } : null,
                        visibleSeries['bb'] ? { name: 'BB Upper', value: hoveredData.bb_upper, color: '#22ab94' } : null,
                        visibleSeries['bb'] ? { name: 'BB Lower', value: hoveredData.bb_lower, color: '#22ab94' } : null,
                        visibleSeries['rsi'] ? { name: 'RSI', value: hoveredData.rsi, color: '#7e57c2' } : null,
                        visibleSeries['macd'] ? { name: 'MACD', value: hoveredData.macd_line, color: '#2962ff' } : null,
                        visibleSeries['stoch'] ? { name: 'Stoch K', value: hoveredData.stoch_k, color: '#2962ff' } : null,
                        visibleSeries['stoch'] ? { name: 'Stoch D', value: hoveredData.stoch_d, color: '#ff6d00' } : null,
                        visibleSeries['atr'] ? { name: 'ATR', value: hoveredData.atr, color: '#b71c1c' } : null,
                        visibleSeries['adx'] ? { name: 'ADX', value: hoveredData.adx, color: '#f50057' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Tenkan', value: hoveredData.tenkan_sen, color: '#9c27b0' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Kijun', value: hoveredData.kijun_sen, color: '#b71c1c' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Span A', value: hoveredData.senkou_span_a, color: '#4caf50' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Span B', value: hoveredData.senkou_span_b, color: '#f44336' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Chikou', value: hoveredData.chikou_span, color: '#3f51b5' } : null,
                        visibleSeries['sar'] ? { name: 'SAR', value: hoveredData.sar, color: '#00bcd4' } : null,
                    ].filter(Boolean) as { name: string; value: number | undefined; color: string }[]
                });
            }
        });

        console.timeEnd('ChartInitialization');

        return () => {
            if (chartsRef.current.main) { chartsRef.current.main.remove(); chartsRef.current.main = undefined; }
        };
    }, []);

    // --- Indicator Management, Sync, & Resize Effect ---
    useEffect(() => {
        if (!chartsRef.current.main) return;

        // --- 2. RSI Chart ---
        if (visibleSeries['rsi'] && rsiChartContainerRef.current && !chartsRef.current.rsi) {
            const rsiChart = createChart(rsiChartContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
                grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
                timeScale: { borderColor: '#2a2e39', timeVisible: true, visible: true },
                rightPriceScale: { borderColor: '#2a2e39' },
                width: rsiChartContainerRef.current.clientWidth || 600,
                height: rsiChartContainerRef.current.clientHeight || 150,
            });
            chartsRef.current.rsi = rsiChart;
            const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#7e57c2', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['rsi'] = rsiSeries;
        } else if (!visibleSeries['rsi'] && chartsRef.current.rsi) {
            chartsRef.current.rsi.remove();
            chartsRef.current.rsi = undefined;
            delete seriesRef.current['rsi'];
        }

        // --- 3. MACD Chart ---
        if (visibleSeries['macd'] && macdChartContainerRef.current && !chartsRef.current.macd) {
            const macdChart = createChart(macdChartContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
                grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
                timeScale: { borderColor: '#2a2e39', timeVisible: true },
                rightPriceScale: { borderColor: '#2a2e39' },
                width: macdChartContainerRef.current.clientWidth || 600,
                height: macdChartContainerRef.current.clientHeight || 150,
            });
            chartsRef.current.macd = macdChart;
            const macdHistSeries = macdChart.addSeries(HistogramSeries, { color: '#26a69a', lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['macd-hist'] = macdHistSeries;
            const macdLineSeries = macdChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['macd-line'] = macdLineSeries;
            const macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#ff6d00', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['macd-signal'] = macdSignalSeries;
        } else if (!visibleSeries['macd'] && chartsRef.current.macd) {
            chartsRef.current.macd.remove();
            chartsRef.current.macd = undefined;
            delete seriesRef.current['macd-hist'];
            delete seriesRef.current['macd-line'];
            delete seriesRef.current['macd-signal'];
        }

        // --- 4. Stochastic Chart ---
        if (visibleSeries['stoch'] && stochChartContainerRef.current && !chartsRef.current.stoch) {
            const stochChart = createChart(stochChartContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
                grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
                timeScale: { borderColor: '#2a2e39', timeVisible: true },
                rightPriceScale: { borderColor: '#2a2e39' },
                width: stochChartContainerRef.current.clientWidth || 600,
                height: stochChartContainerRef.current.clientHeight || 150,
            });
            chartsRef.current.stoch = stochChart;
            const stochKSeries = stochChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['stoch-k'] = stochKSeries;
            const stochDSeries = stochChart.addSeries(LineSeries, { color: '#ff6d00', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['stoch-d'] = stochDSeries;

            // Overbought/Oversold lines
            // We don't store these in seriesRef as we don't update them often, but we need to populate them initially.
            // Actually, we can just set data here once.
            if (dataRef.current) {
                stochChart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false }).setData(dataRef.current.map(d => ({ time: Math.floor(d.time as number / 1000) as any, value: 80 })));
                stochChart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false }).setData(dataRef.current.map(d => ({ time: Math.floor(d.time as number / 1000) as any, value: 20 })));
            }
        } else if (!visibleSeries['stoch'] && chartsRef.current.stoch) {
            chartsRef.current.stoch.remove();
            chartsRef.current.stoch = undefined;
            delete seriesRef.current['stoch-k'];
            delete seriesRef.current['stoch-d'];
        }

        // --- 5. ATR Chart ---
        if (visibleSeries['atr'] && atrChartContainerRef.current && !chartsRef.current.atr) {
            const atrChart = createChart(atrChartContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
                grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
                timeScale: { borderColor: '#2a2e39', timeVisible: true },
                rightPriceScale: { borderColor: '#2a2e39' },
                width: atrChartContainerRef.current.clientWidth || 600,
                height: atrChartContainerRef.current.clientHeight || 150,
            });
            chartsRef.current.atr = atrChart;
            const atrSeries = atrChart.addSeries(LineSeries, { color: '#b71c1c', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['atr'] = atrSeries;
        } else if (!visibleSeries['atr'] && chartsRef.current.atr) {
            chartsRef.current.atr.remove();
            chartsRef.current.atr = undefined;
            delete seriesRef.current['atr'];
        }

        // --- 6. ADX Chart ---
        if (visibleSeries['adx'] && adxChartContainerRef.current && !chartsRef.current.adx) {
            const adxChart = createChart(adxChartContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
                grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
                timeScale: { borderColor: '#2a2e39', timeVisible: true },
                rightPriceScale: { borderColor: '#2a2e39' },
                width: adxChartContainerRef.current.clientWidth || 600,
                height: adxChartContainerRef.current.clientHeight || 150,
            });
            chartsRef.current.adx = adxChart;
            const adxSeries = adxChart.addSeries(LineSeries, { color: '#f50057', lineWidth: 2, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['adx'] = adxSeries;
            const diPlusSeries = adxChart.addSeries(LineSeries, { color: '#00e676', lineWidth: 1, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['di-plus'] = diPlusSeries;
            const diMinusSeries = adxChart.addSeries(LineSeries, { color: '#ff1744', lineWidth: 1, lastValueVisible: chartSettings.showIndicatorPriceLabels });
            seriesRef.current['di-minus'] = diMinusSeries;

            if (dataRef.current) {
                adxChart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false }).setData(dataRef.current.map(d => ({ time: Math.floor(d.time as number / 1000) as any, value: 25 })));
            }
        } else if (!visibleSeries['adx'] && chartsRef.current.adx) {
            chartsRef.current.adx.remove();
            chartsRef.current.adx = undefined;
            delete seriesRef.current['adx'];
            delete seriesRef.current['di-plus'];
            delete seriesRef.current['di-minus'];
        }

        // --- Synchronization ---
        const activeCharts = [
            chartsRef.current.main,
            chartsRef.current.rsi,
            chartsRef.current.macd,
            chartsRef.current.stoch,
            chartsRef.current.atr,
            chartsRef.current.adx
        ].filter(c => c !== undefined) as IChartApi[];

        const isFetchingHistory = { current: false };
        const subscriptions: { chart: IChartApi, handler: (range: any) => void }[] = [];

        activeCharts.forEach(c => {
            const handler = (range: any) => {
                if (range) {
                    activeCharts.forEach(other => {
                        if (c !== other) {
                            other.timeScale().setVisibleLogicalRange(range);
                        }
                    });

                    if (range.from < 5 && !isFetchingHistory.current && onLoadMoreHistory) {
                        isFetchingHistory.current = true;
                        console.log('Fetching history...');
                        onLoadMoreHistory();
                        setTimeout(() => { isFetchingHistory.current = false; }, 1000);
                    }
                }
            };
            c.timeScale().subscribeVisibleLogicalRangeChange(handler);
            subscriptions.push({ chart: c, handler });
        });

        // --- Resize Observer ---
        let resizeTimeout: any;
        const resizeObserver = new ResizeObserver(() => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (mainChartContainerRef.current && chartsRef.current.main) {
                    const width = mainChartContainerRef.current.clientWidth;
                    const height = mainChartContainerRef.current.clientHeight;
                    chartsRef.current.main.applyOptions({ width, height });
                    setChartDimensions({ width, height });
                }
                if (rsiChartContainerRef.current && chartsRef.current.rsi) {
                    chartsRef.current.rsi.applyOptions({ width: rsiChartContainerRef.current.clientWidth, height: rsiChartContainerRef.current.clientHeight });
                }
                if (macdChartContainerRef.current && chartsRef.current.macd) {
                    chartsRef.current.macd.applyOptions({ width: macdChartContainerRef.current.clientWidth, height: macdChartContainerRef.current.clientHeight });
                }
                if (stochChartContainerRef.current && chartsRef.current.stoch) {
                    chartsRef.current.stoch.applyOptions({ width: stochChartContainerRef.current.clientWidth, height: stochChartContainerRef.current.clientHeight });
                }
                if (atrChartContainerRef.current && chartsRef.current.atr) {
                    chartsRef.current.atr.applyOptions({ width: atrChartContainerRef.current.clientWidth, height: atrChartContainerRef.current.clientHeight });
                }
                if (adxChartContainerRef.current && chartsRef.current.adx) {
                    chartsRef.current.adx.applyOptions({ width: adxChartContainerRef.current.clientWidth, height: adxChartContainerRef.current.clientHeight });
                }
            }, 50);
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        // --- Crosshair Move (for Legend) ---
        const crosshairHandler = (param: any) => {
            if (!param.time || param.seriesData.size === 0) {
                setLegendData({ ohlc: null, indicators: [] });
                return;
            }

            // Find the data point for the hovered time
            const timeValue = param.time as number;
            // Use dataRef.current for latest data
            const hoveredData = dataRef.current.find(d => Math.floor(d.time as number / 1000) === timeValue);

            if (hoveredData) {
                setLegendData({
                    ohlc: { open: hoveredData.open, high: hoveredData.high, low: hoveredData.low, close: hoveredData.close },
                    indicators: [
                        visibleSeries['sma-20'] ? { name: 'SMA 20', value: hoveredData.sma20, color: '#f7525f' } : null,
                        visibleSeries['ema-20'] ? { name: 'EMA 20', value: hoveredData.ema20, color: '#2962ff' } : null,
                        visibleSeries['bb'] ? { name: 'BB Upper', value: hoveredData.bb_upper, color: '#22ab94' } : null,
                        visibleSeries['bb'] ? { name: 'BB Lower', value: hoveredData.bb_lower, color: '#22ab94' } : null,
                        visibleSeries['rsi'] ? { name: 'RSI', value: hoveredData.rsi, color: '#7e57c2' } : null,
                        visibleSeries['macd'] ? { name: 'MACD', value: hoveredData.macd_line, color: '#2962ff' } : null,
                        visibleSeries['stoch'] ? { name: 'Stoch K', value: hoveredData.stoch_k, color: '#2962ff' } : null,
                        visibleSeries['stoch'] ? { name: 'Stoch D', value: hoveredData.stoch_d, color: '#ff6d00' } : null,
                        visibleSeries['atr'] ? { name: 'ATR', value: hoveredData.atr, color: '#b71c1c' } : null,
                        visibleSeries['adx'] ? { name: 'ADX', value: hoveredData.adx, color: '#f50057' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Tenkan', value: hoveredData.tenkan_sen, color: '#9c27b0' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Kijun', value: hoveredData.kijun_sen, color: '#b71c1c' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Span A', value: hoveredData.senkou_span_a, color: '#4caf50' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Span B', value: hoveredData.senkou_span_b, color: '#f44336' } : null,
                        visibleSeries['ichimoku'] ? { name: 'Chikou', value: hoveredData.chikou_span, color: '#3f51b5' } : null,
                        visibleSeries['sar'] ? { name: 'SAR', value: hoveredData.sar, color: '#00bcd4' } : null,
                    ].filter(Boolean) as { name: string; value: number | undefined; color: string }[]
                });
            }
        };
        chartsRef.current.main.subscribeCrosshairMove(crosshairHandler);

        // Populate Data for new charts
        if (dataRef.current && dataRef.current.length > 0) {
            updateChartData(dataRef.current);
        }

        return () => {
            subscriptions.forEach(sub => sub.chart.timeScale().unsubscribeVisibleLogicalRangeChange(sub.handler));
            resizeObserver.disconnect();
            if (chartsRef.current.main) {
                chartsRef.current.main.unsubscribeCrosshairMove(crosshairHandler);
            }
        };
    }, [visibleSeries, updateChartData]);
    useEffect(() => {
        updateChartData(data);
    }, [data, updateChartData]);




    useEffect(() => {
        if (!seriesRef.current) return;
        if (seriesRef.current['sma-20']) seriesRef.current['sma-20'].applyOptions({ visible: visibleSeries['sma-20'] });
        if (seriesRef.current['ema-20']) seriesRef.current['ema-20'].applyOptions({ visible: visibleSeries['ema-20'] });
        if (seriesRef.current['bb-upper']) seriesRef.current['bb-upper'].applyOptions({ visible: visibleSeries['bb'] });
        if (seriesRef.current['bb-lower']) seriesRef.current['bb-lower'].applyOptions({ visible: visibleSeries['bb'] });

        // Ichimoku
        if (seriesRef.current['tenkan']) seriesRef.current['tenkan'].applyOptions({ visible: visibleSeries['ichimoku'] });
        if (seriesRef.current['kijun']) seriesRef.current['kijun'].applyOptions({ visible: visibleSeries['ichimoku'] });
        if (seriesRef.current['spanA']) seriesRef.current['spanA'].applyOptions({ visible: visibleSeries['ichimoku'] });
        if (seriesRef.current['spanB']) seriesRef.current['spanB'].applyOptions({ visible: visibleSeries['ichimoku'] });
        if (seriesRef.current['chikou']) seriesRef.current['chikou'].applyOptions({ visible: visibleSeries['ichimoku'] });
        if (cloudSeriesRef.current) cloudSeriesRef.current.applyOptions({ visible: visibleSeries['ichimoku'] });

        // Parabolic SAR
        if (seriesRef.current['sar']) seriesRef.current['sar'].applyOptions({ visible: visibleSeries['sar'] });
    }, [visibleSeries]);

    // Effect for chart settings changes (apply dynamically without re-creating charts)
    // Effect for chart settings changes (apply dynamically without re-creating charts)
    useEffect(() => {
        const activeCharts = [
            chartsRef.current.main,
            chartsRef.current.rsi,
            chartsRef.current.macd,
            chartsRef.current.stoch,
            chartsRef.current.atr,
            chartsRef.current.adx
        ].filter(c => c !== undefined) as IChartApi[];

        activeCharts.forEach(chart => {
            chart.applyOptions({
                grid: {
                    vertLines: { color: chartSettings.showGrid ? '#2a2e39' : 'transparent' },
                    horzLines: { color: chartSettings.showGrid ? '#2a2e39' : 'transparent' }
                },
                crosshair: {
                    horzLine: { labelVisible: chartSettings.showCrosshairLabels },
                    vertLine: { labelVisible: chartSettings.showCrosshairLabels }
                }
            });
        });

        // Main Series Settings
        if (seriesRef.current['main']) {
            seriesRef.current['main'].applyOptions({
                lastValueVisible: chartSettings.showLastPriceLabel,
                priceLineVisible: chartSettings.showLastPriceLabel
            });
        }

        if (seriesRef.current['volume']) {
            seriesRef.current['volume'].applyOptions({ visible: chartSettings.showVolume });
        }

        // Update indicator price labels for ALL series
        const indicatorKeys = [
            'sma-20', 'ema-20', 'bb-upper', 'bb-lower',
            'tenkan', 'kijun', 'sar',
            'rsi',
            'macd-line', 'macd-signal', 'macd-hist',
            'stoch-k', 'stoch-d',
            'atr',
            'adx', 'di-plus', 'di-minus'
        ];

        indicatorKeys.forEach(key => {
            if (seriesRef.current[key]) {
                seriesRef.current[key].applyOptions({ lastValueVisible: chartSettings.showIndicatorPriceLabels });
            }
        });

    }, [chartSettings, visibleSeries]); // Added visibleSeries to ensure we update new charts if settings change or charts appear

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <TVLegend
                ohlc={legendData.ohlc}
                indicators={legendData.indicators}
                showOHLC={chartSettings.showOHLC}
                showIndicators={chartSettings.showIndicatorValues}
            />
            <div ref={mainChartContainerRef} style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
                <DrawingOverlay
                    chart={chartsRef.current.main}
                    series={seriesRef.current['main']}
                    data={data}
                    drawings={drawings}
                    activeTool={activeTool}
                    isMagnetMode={isMagnetMode}
                    onAddDrawing={handleAddDrawing}
                    onUpdateDrawing={handleUpdateDrawing}
                    onDeleteDrawing={handleDeleteDrawing}
                    onDrawingComplete={onDrawingComplete}
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                />
            </div>
            {visibleSeries['rsi'] && <div ref={rsiChartContainerRef} style={{ height: '150px', minHeight: '150px', borderTop: '1px solid #2a2e39' }} />}
            {visibleSeries['macd'] && <div ref={macdChartContainerRef} style={{ height: '150px', minHeight: '150px', borderTop: '1px solid #2a2e39' }} />}
            {visibleSeries['stoch'] && <div ref={stochChartContainerRef} style={{ height: '150px', minHeight: '150px', borderTop: '1px solid #2a2e39' }} />}
            {visibleSeries['atr'] && <div ref={atrChartContainerRef} style={{ height: '150px', minHeight: '150px', borderTop: '1px solid #2a2e39' }} />}
            {visibleSeries['adx'] && <div ref={adxChartContainerRef} style={{ height: '150px', minHeight: '150px', borderTop: '1px solid #2a2e39' }} />}

            {/* Dynamic Spacer to ensure bottom content is never hidden */}
            <div style={{ minHeight: '100px', flexShrink: 0 }} />
        </div>
    );
};


