export interface DataPoint {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;

    // Indicators
    sma20?: number;
    ema20?: number;
    bb_upper?: number;
    bb_lower?: number;
    rsi?: number;

    // MACD
    macd_line?: number;
    macd_signal?: number;
    macd_hist?: number;

    // Stochastic
    stoch_k?: number;
    stoch_d?: number;

    // ATR
    atr?: number;

    // ADX
    adx?: number;
    di_plus?: number;
    di_minus?: number;

    // Ichimoku
    tenkan_sen?: number;
    kijun_sen?: number;
    senkou_span_a?: number;
    senkou_span_b?: number;
    chikou_span?: number;

    // Parabolic SAR
    sar?: number;
}
