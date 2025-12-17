export type DrawingType = 'trend-line' | 'horizontal-line' | 'fibonacci' | 'rectangle' | 'text' | 'crosshair' | 'measure' | 'zoom' | 'magnet' | 'icon' | 'brush' | 'elliott-wave' | 'pitchfork' | 'long-position' | 'short-position';

export interface Point {
    time: number;
    price: number;
}

export interface Drawing {
    id: string;
    type: DrawingType;
    points: Point[]; // 1 or 2 points depending on tool
    properties?: {
        color?: string;
        lineWidth?: number;
        text?: string;
        fillColor?: string;
    };
}

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const isPointNearLine = (
    point: { x: number; y: number },
    start: { x: number; y: number },
    end: { x: number; y: number },
    threshold: number = 5
): boolean => {
    const { x, y } = point;
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
};

export const isPointInRect = (
    point: { x: number; y: number },
    rectStart: { x: number; y: number },
    rectEnd: { x: number; y: number }
): boolean => {
    const minX = Math.min(rectStart.x, rectEnd.x);
    const maxX = Math.max(rectStart.x, rectEnd.x);
    const minY = Math.min(rectStart.y, rectEnd.y);
    const maxY = Math.max(rectStart.y, rectEnd.y);

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
};
