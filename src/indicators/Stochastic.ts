import type { DataPoint } from '../types';

export function calculateStochastic(data: DataPoint[], kPeriod: number = 14, dPeriod: number = 3, smooth: number = 3) {
    const kLine: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < kPeriod - 1) {
            kLine.push(NaN);
            continue;
        }

        let lowestLow = Infinity;
        let highestHigh = -Infinity;

        for (let j = i - kPeriod + 1; j <= i; j++) {
            if (data[j].low < lowestLow) lowestLow = data[j].low;
            if (data[j].high > highestHigh) highestHigh = data[j].high;
        }

        const currentClose = data[i].close;
        const kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        kLine.push(kValue);
    }

    // Smooth K
    // We need to pass kLine as DataPoint[] to calculateSMA, but calculateSMA expects DataPoint[]
    // Let's make a helper or just implement simple SMA here
    const smoothK = simpleSMA(kLine, smooth);
    const dLine = simpleSMA(smoothK, dPeriod);

    return { k: smoothK, d: dLine };
}

function simpleSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1 || isNaN(data[i])) {
            result.push(NaN);
        } else {
            let sum = 0;
            let count = 0;
            for (let j = i - period + 1; j <= i; j++) {
                if (!isNaN(data[j])) {
                    sum += data[j];
                    count++;
                }
            }
            result.push(count === period ? sum / period : NaN);
        }
    }
    return result;
}
