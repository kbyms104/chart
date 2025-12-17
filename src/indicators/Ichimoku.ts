import type { DataPoint } from '../types';

export function calculateIchimoku(data: DataPoint[], tenkanPeriod: number = 9, kijunPeriod: number = 26, senkouBPeriod: number = 52, displacement: number = 26) {
    const tenkanSen: number[] = [];
    const kijunSen: number[] = [];
    const senkouSpanA: number[] = [];
    const senkouSpanB: number[] = [];
    const chikouSpan: number[] = [];

    // Helper to get (max + min) / 2
    const getAverage = (period: number, index: number) => {
        if (index < period - 1) return NaN;
        let min = Infinity;
        let max = -Infinity;
        for (let i = index - period + 1; i <= index; i++) {
            if (data[i].low < min) min = data[i].low;
            if (data[i].high > max) max = data[i].high;
        }
        return (max + min) / 2;
    };

    for (let i = 0; i < data.length; i++) {
        tenkanSen.push(getAverage(tenkanPeriod, i));
        kijunSen.push(getAverage(kijunPeriod, i));

        // Senkou Span A: (Tenkan + Kijun) / 2, shifted forward by displacement
        // We calculate it for current i, but it belongs to i + displacement
        // So we push it to result array but we need to handle the shift.
        // Actually, for plotting, we usually align arrays.
        // Let's just calculate values.

        // Senkou Span B: (Max + Min) / 2 over senkouBPeriod, shifted forward

        // Chikou Span: Close shifted backward by displacement
    }

    // Post-processing for shifts
    // We want arrays aligned with time.

    // Senkou Span A and B are shifted FORWARD (into the future)
    // So value at index i is plotted at i + displacement
    // This means for current time i, the value comes from i - displacement?
    // No, value calculated at i is for i + displacement.
    // So at time T, we see value calculated at T - displacement.

    for (let i = 0; i < data.length; i++) {
        // Senkou Span A
        if (i >= displacement) {
            const prevIdx = i - displacement;
            const ts = tenkanSen[prevIdx];
            const ks = kijunSen[prevIdx];
            if (!isNaN(ts) && !isNaN(ks)) {
                senkouSpanA.push((ts + ks) / 2);
            } else {
                senkouSpanA.push(NaN);
            }
        } else {
            senkouSpanA.push(NaN);
        }

        // Senkou Span B
        if (i >= displacement) {
            const prevIdx = i - displacement;
            const val = getAverage(senkouBPeriod, prevIdx);
            senkouSpanB.push(val);
        } else {
            senkouSpanB.push(NaN);
        }

        // Chikou Span (shifted BACKWARD)
        // Value at i is Close at i + displacement?
        // No, Close at i is plotted at i - displacement.
        // So at time T, we see Close from T + displacement.
        if (i + displacement < data.length) {
            chikouSpan.push(data[i + displacement].close);
        } else {
            chikouSpan.push(NaN);
        }
    }

    return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
}
