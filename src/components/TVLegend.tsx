import React from 'react';

interface IndicatorValue {
    name: string;
    value: number | undefined;
    color: string;
}

interface Props {
    ohlc: { open: number; high: number; low: number; close: number } | null;
    indicators: IndicatorValue[];
    showOHLC: boolean;
    showIndicators: boolean;
}

export const TVLegend: React.FC<Props> = ({ ohlc, indicators, showOHLC, showIndicators }) => {
    const hasIndicators = indicators.some(ind => ind.value !== undefined);
    if ((!showOHLC || !ohlc) && (!showIndicators || !hasIndicators)) return null;

    const change = ohlc ? ohlc.close - ohlc.open : 0;
    const changePercent = ohlc ? (change / ohlc.open) * 100 : 0;
    const priceColor = change >= 0 ? '#089981' : '#f23645';

    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10,
            pointerEvents: 'none',
            backgroundColor: 'rgba(19, 23, 34, 0.8)',
            padding: '8px',
            borderRadius: '4px'
        }}>
            {/* OHLC */}
            {showOHLC && ohlc && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#787b86' }}>O <span style={{ color: priceColor }}>{ohlc.open.toFixed(2)}</span></span>
                    <span style={{ color: '#787b86' }}>H <span style={{ color: priceColor }}>{ohlc.high.toFixed(2)}</span></span>
                    <span style={{ color: '#787b86' }}>L <span style={{ color: priceColor }}>{ohlc.low.toFixed(2)}</span></span>
                    <span style={{ color: '#787b86' }}>C <span style={{ color: priceColor }}>{ohlc.close.toFixed(2)}</span></span>
                    <span style={{ color: priceColor }}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                    </span>
                </div>
            )}

            {/* Indicators */}
            {showIndicators && indicators.filter(ind => ind.value !== undefined).map(ind => (
                <div key={ind.name} style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: ind.color }}>{ind.name}:</span>
                    <span style={{ color: ind.color }}>{ind.value?.toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
};
