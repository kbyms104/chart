import type { DataPoint } from '../types';

export function calculateSMA(data: DataPoint[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
            result.push(sum / period);
        }
    }
    return result;
}

export function calculateEMA(data: DataPoint[], period: number): number[] {
    const k = 2 / (period + 1);
    const result: number[] = [];
    let ema = data[0].close;

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            result.push(ema);
            continue;
        }
        ema = data[i].close * k + result[i - 1] * (1 - k);
        result.push(ema);
    }
    return result;
}
