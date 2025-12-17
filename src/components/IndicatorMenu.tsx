import React from 'react';

interface Props {
    visibleSeries: Record<string, boolean>;
    onToggleSeries: (seriesId: string) => void;
    onClose: () => void;
}

export const IndicatorMenu: React.FC<Props> = ({ visibleSeries, onToggleSeries, onClose }) => {
    const indicators = [
        { id: 'sma-20', label: 'Moving Average (20)' },
        { id: 'ema-20', label: 'EMA (20)' },
        { id: 'bb', label: 'Bollinger Bands' },
        { id: 'rsi', label: 'RSI (14)' },
        { id: 'macd', label: 'MACD (12, 26, 9)' },
        { id: 'stoch', label: 'Stochastic (14, 3, 3)' },
        { id: 'atr', label: 'ATR (14)' },
        { id: 'adx', label: 'ADX (14)' },
        { id: 'ichimoku', label: 'Ichimoku Cloud' },
        { id: 'sar', label: 'Parabolic SAR' },
    ];

    return (
        <div style={{
            position: 'absolute',
            top: '50px',
            left: '250px', // Adjust based on header layout
            backgroundColor: '#1e222d',
            border: '1px solid #2a2e39',
            borderRadius: '4px',
            padding: '8px 0',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            minWidth: '200px'
        }}>
            <div style={{
                padding: '8px 16px',
                borderBottom: '1px solid #2a2e39',
                fontWeight: 'bold',
                color: '#d1d4dc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>Indicators</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '8px 0' }}>
                {indicators.map(ind => (
                    <div key={ind.id}
                        onClick={() => onToggleSeries(ind.id)}
                        style={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            color: '#d1d4dc',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2e39'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <input
                            type="checkbox"
                            checked={visibleSeries[ind.id] || false}
                            readOnly
                            style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px' }}>{ind.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
