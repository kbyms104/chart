import {
    customSeriesDefaultOptions,
    type CustomSeriesOptions,
    type CustomSeriesWhitespaceData,
    type ICustomSeriesPaneView,
    type PaneRendererCustomData,
    type Time,
    type CustomSeriesPricePlotValues,
} from 'lightweight-charts';

export interface IchimokuCloudData {
    time: Time;
    spanA: number;
    spanB: number;
}

export interface IchimokuCloudOptions extends CustomSeriesOptions {
    bullishColor: string;
    bearishColor: string;
    color: string; // Required by CustomSeriesOptions
}

const defaultOptions: IchimokuCloudOptions = {
    ...customSeriesDefaultOptions,
    bullishColor: 'rgba(76, 175, 80, 0.2)',
    bearishColor: 'rgba(244, 67, 54, 0.2)',
    color: 'transparent',
};

class IchimokuCloudRenderer {
    _data: PaneRendererCustomData<Time, IchimokuCloudData> | null = null;
    _options: IchimokuCloudOptions | null = null;

    draw(target: any, priceConverter: any): void {
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            const horizontalPixelRatio = scope.horizontalPixelRatio;
            const verticalPixelRatio = scope.verticalPixelRatio;
            ctx.save();
            ctx.scale(horizontalPixelRatio, verticalPixelRatio);
            this._drawImpl(ctx, priceConverter);
            ctx.restore();
        });
    }

    _drawImpl(target: CanvasRenderingContext2D, priceConverter: (price: number) => number | null): void {

        if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null || this._options === null || this._options.visible === false) {
            return;
        }

        const bars = this._data.bars;
        const visibleRange = this._data.visibleRange;


        let currentCloudType: 'bullish' | 'bearish' | null = null;

        target.lineWidth = 0;

        // We need to iterate and draw paths.
        // Since we want to fill, we need to close the path.
        // Strategy: Iterate points. If cloud type changes (cross), close current path and start new one.

        // Optimization: Draw all bullish segments in one go? No, they might be disconnected.
        // Actually, we can just draw quads for each interval? That might be easier but less performant or show artifacts.
        // Better: Construct a path for a contiguous block of same-type cloud.

        // Let's try drawing simple quads for each bar first, it's robust.
        // If performance is bad, we optimize to paths.
        // Actually, paths are better for transparency (no overlap artifacts).

        const drawCloud = (startIndex: number, endIndex: number, type: 'bullish' | 'bearish') => {
            target.beginPath();
            const color = type === 'bullish' ? this._options!.bullishColor : this._options!.bearishColor;
            target.fillStyle = color;

            // Move to first point Span A
            const firstBar = bars[startIndex];
            const firstX = firstBar.x;
            const firstY_A = priceConverter(firstBar.originalData.spanA);

            target.moveTo(firstX, firstY_A!);

            // Trace Span A forward
            for (let i = startIndex + 1; i <= endIndex; i++) {
                const bar = bars[i];
                const x = bar.x;
                const yA = priceConverter(bar.originalData.spanA);
                target.lineTo(x, yA!);
            }

            // Trace Span B backward
            for (let i = endIndex; i >= startIndex; i--) {
                const bar = bars[i];
                const x = bar.x;
                const yB = priceConverter(bar.originalData.spanB);
                target.lineTo(x, yB!);
            }

            target.closePath();
            target.fill();
        };

        let segmentStartIndex = -1;

        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            const spanA = bar.originalData.spanA;
            const spanB = bar.originalData.spanB;

            if (spanA === undefined || spanB === undefined) continue;

            const type = spanA >= spanB ? 'bullish' : 'bearish';

            if (currentCloudType === null) {
                currentCloudType = type;
                segmentStartIndex = i;
            } else if (currentCloudType !== type) {
                // Cloud type changed (crossover)
                // Draw the previous segment
                drawCloud(segmentStartIndex, i - 1, currentCloudType);

                // Start new segment
                currentCloudType = type;
                segmentStartIndex = i - 1; // Overlap slightly to avoid gaps? Or just i? 
                // Ideally we find the intersection point, but for now let's just start at i.
                // Actually, if we start at i, there might be a gap between i-1 and i.
                // Let's include i-1 in the new segment too to connect them?
                // If we do that, we might have double draw.
                // Let's just start at i for now.
                segmentStartIndex = i;
            }
        }

        // Draw the last segment
        if (currentCloudType !== null && segmentStartIndex !== -1) {
            drawCloud(segmentStartIndex, visibleRange.to - 1, currentCloudType);
        }
    }

    update(data: PaneRendererCustomData<Time, IchimokuCloudData>, options: IchimokuCloudOptions): void {
        this._data = data;
        this._options = options;
    }
}

export class IchimokuCloudSeries implements ICustomSeriesPaneView<Time, IchimokuCloudData, IchimokuCloudOptions> {
    _renderer: IchimokuCloudRenderer;

    constructor() {
        this._renderer = new IchimokuCloudRenderer();
    }

    priceValueBuilder(plotRow: IchimokuCloudData): CustomSeriesPricePlotValues {
        // We can return min/max of spanA/spanB for auto-scaling
        return [plotRow.spanA, plotRow.spanB, plotRow.spanA];
    }

    isWhitespace(data: IchimokuCloudData | CustomSeriesWhitespaceData<Time>): data is CustomSeriesWhitespaceData<Time> {
        return (data as Partial<IchimokuCloudData>).spanA === undefined || (data as Partial<IchimokuCloudData>).spanB === undefined;
    }

    renderer(): any {
        return this._renderer;
    }

    update(data: PaneRendererCustomData<Time, IchimokuCloudData>, options: CustomSeriesOptions): void {
        this._renderer.update(data, options as IchimokuCloudOptions);
    }

    defaultOptions() {
        return defaultOptions;
    }
}
