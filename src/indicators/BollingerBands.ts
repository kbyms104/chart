import type { DataPoint } from '../types';
import { calculateSMA } from './MovingAverage';

export function calculateBollingerBands(data: DataPoint[], period: number = 20, multiplier: number = 2) {
    const sma = calculateSMA(data, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            upper.push(NaN);
            lower.push(NaN);
            continue;
        }

        let sumSqDiff = 0;
        const mean = sma[i];
        for (let j = i - period + 1; j <= i; j++) {
            sumSqDiff += Math.pow(data[j].close - mean, 2);
        }
        const stdDev = Math.sqrt(sumSqDiff / period);

        upper.push(mean + multiplier * stdDev);
        lower.push(mean - multiplier * stdDev);
    }

    return { upper, lower, middle: sma };
}
