import type { DataPoint } from '../types';

export function calculateRSI(data: DataPoint[], period: number = 14): number[] {
    const result = new Array(data.length).fill(NaN);

    if (data.length <= period) {
        return result;
    }

    let avgGain = 0;
    let avgLoss = 0;

    // 1. Initial SMA Calculation
    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) avgGain += change;
        else avgLoss -= change;
    }

    avgGain /= period;
    avgLoss /= period;

    // 2. First RSI Value
    let rs = avgGain / (avgLoss || 1e-10);
    result[period] = 100 - (100 / (1 + rs));

    // 3. Wilder's Smoothing for the rest
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        rs = avgGain / (avgLoss || 1e-10);
        result[i] = 100 - (100 / (1 + rs));
    }

    return result;
}
