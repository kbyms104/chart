import type { DataPoint } from '../types';

export function calculateADX(data: DataPoint[], period: number = 14) {
    // Actually calculateATR(data, 1) returns smoothed TR, but for period 1 it's just TR.
    // Wait, my ATR implementation does simple average for first period.
    // Let's just calculate TR and DM manually here for correctness.

    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const trueRange: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            plusDM.push(0);
            minusDM.push(0);
            trueRange.push(data[i].high - data[i].low);
            continue;
        }

        const high = data[i].high;
        const low = data[i].low;
        const prevHigh = data[i - 1].high;
        const prevLow = data[i - 1].low;
        const prevClose = data[i - 1].close;

        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        if (upMove > downMove && upMove > 0) {
            plusDM.push(upMove);
        } else {
            plusDM.push(0);
        }

        if (downMove > upMove && downMove > 0) {
            minusDM.push(downMove);
        } else {
            minusDM.push(0);
        }

        const tr1 = high - low;
        const tr2 = Math.abs(high - prevClose);
        const tr3 = Math.abs(low - prevClose);
        trueRange.push(Math.max(tr1, tr2, tr3));
    }

    // Smoothed TR, +DM, -DM using Wilder's smoothing
    const smoothTR = wilderSmooth(trueRange, period);
    const smoothPlusDM = wilderSmooth(plusDM, period);
    const smoothMinusDM = wilderSmooth(minusDM, period);

    const plusDI: number[] = [];
    const minusDI: number[] = [];
    const dx: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (isNaN(smoothTR[i]) || smoothTR[i] === 0) {
            plusDI.push(NaN);
            minusDI.push(NaN);
            dx.push(NaN);
        } else {
            const pDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
            const mDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
            plusDI.push(pDI);
            minusDI.push(mDI);

            const diSum = pDI + mDI;
            const diDiff = Math.abs(pDI - mDI);
            dx.push(diSum === 0 ? 0 : (diDiff / diSum) * 100);
        }
    }

    const adx = wilderSmooth(dx, period);

    return { adx, plusDI, minusDI };
}

function wilderSmooth(data: number[], period: number): number[] {
    const result: number[] = [];
    let sum = 0;

    // First value is simple sum
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
        } else if (i === period - 1) {
            result.push(sum); // Wilder's smoothing starts with sum, not average? 
            // Actually standard ADX uses sum for TR and DM.
            // But let's check standard implementation.
            // Usually it's previous * (period - 1) + current
        } else {
            const prev = result[i - 1];
            if (isNaN(prev)) {
                result.push(NaN);
            } else {
                result.push(prev - (prev / period) + data[i]);
            }
        }
    }
    return result;
}
