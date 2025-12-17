import type { DataPoint } from '../types';

export function calculateParabolicSAR(data: DataPoint[], start: number = 0.02, increment: number = 0.02, max: number = 0.2) {
    const sar: number[] = [];
    let isLong = true;
    let af = start;
    let ep = data[0].high;
    let sarValue = data[0].low;

    sar.push(sarValue);

    for (let i = 1; i < data.length; i++) {
        const prevSar = sar[i - 1];
        const prevHigh = data[i - 1].high;
        const prevLow = data[i - 1].low;

        if (isLong) {
            sarValue = prevSar + af * (ep - prevSar);
            sarValue = Math.min(sarValue, prevLow, data[i - 2] ? data[i - 2].low : prevLow);

            if (data[i].low < sarValue) {
                isLong = false;
                sarValue = ep;
                ep = data[i].low;
                af = start;
            } else {
                if (data[i].high > ep) {
                    ep = data[i].high;
                    af = Math.min(af + increment, max);
                }
            }
        } else {
            sarValue = prevSar + af * (ep - prevSar);
            sarValue = Math.max(sarValue, prevHigh, data[i - 2] ? data[i - 2].high : prevHigh);

            if (data[i].high > sarValue) {
                isLong = true;
                sarValue = ep;
                ep = data[i].high;
                af = start;
            } else {
                if (data[i].low < ep) {
                    ep = data[i].low;
                    af = Math.min(af + increment, max);
                }
            }
        }

        sar.push(sarValue);
    }

    return sar;
}
