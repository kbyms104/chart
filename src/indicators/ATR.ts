import type { DataPoint } from '../types';

export function calculateATR(data: DataPoint[], period: number = 14): number[] {
    const atr = new Array(data.length).fill(NaN);

    if (data.length <= period) {
        return atr;
    }

    const tr: number[] = new Array(data.length).fill(0);

    // 1. Calculate TR for all points
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            tr[i] = data[i].high - data[i].low;
        } else {
            const high = data[i].high;
            const low = data[i].low;
            const prevClose = data[i - 1].close;
            tr[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        }
    }

    // 2. Initial ATR (Simple Average)
    let initialATR = 0;
    for (let i = 0; i < period; i++) {
        initialATR += tr[i];
    }
    initialATR /= period;

    atr[period - 1] = initialATR;

    // 3. Wilder's Smoothing for the rest
    for (let i = period; i < data.length; i++) {
        const prevATR = atr[i - 1];
        const currentTR = tr[i];
        const currentATR = (prevATR * (period - 1) + currentTR) / period;
        atr[i] = currentATR;
    }

    return atr;
}
