import type { DataPoint } from '../types';
import { calculateEMA } from './MovingAverage';

export function calculateMACD(data: DataPoint[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);

    const macdLine: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
            macdLine.push(NaN);
        } else {
            macdLine.push(fastEMA[i] - slowEMA[i]);
        }
    }

    // Calculate Signal Line (EMA of MACD Line)
    // We need to create dummy DataPoints for calculateEMA
    const macdDataPoints = macdLine.map((val, i) => ({ ...data[i], close: val }));
    const signalLine = calculateEMA(macdDataPoints, signalPeriod);

    const histogram: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
            histogram.push(NaN);
        } else {
            histogram.push(macdLine[i] - signalLine[i]);
        }
    }

    return { macdLine, signalLine, histogram };
}
