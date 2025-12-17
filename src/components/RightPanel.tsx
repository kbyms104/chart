import React from 'react';

interface Props {
    onSelectSymbol: (symbol: string) => void;
    currentSymbol: string;
}

export const RightPanel: React.FC<Props> = ({ onSelectSymbol, currentSymbol }) => {
    const watchlist = [
        { symbol: 'AAPL', price: '150.23', change: '+1.2%' },
        { symbol: 'TSLA', price: '240.50', change: '-0.5%' },
        { symbol: 'NVDA', price: '450.10', change: '+3.4%' },
        { symbol: 'MSFT', price: '320.90', change: '+0.8%' },
        { symbol: 'GOOGL', price: '130.45', change: '-0.2%' },
        { symbol: 'AMZN', price: '135.20', change: '+1.5%' },
        { symbol: 'BTCUSD', price: '42000', change: '+2.1%' },
        { symbol: 'ETHUSD', price: '2250', change: '+1.8%' },
    ];

    return (
        <div style={{
            width: '250px',
            backgroundColor: '#131722',
            borderLeft: '1px solid #2a2e39',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '12px',
                borderBottom: '1px solid #2a2e39',
                fontWeight: 'bold',
                color: '#d1d4dc'
            }}>
                Watchlist
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {watchlist.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #1e222d',
                        backgroundColor: item.symbol === currentSymbol ? '#2a2e39' : 'transparent'
                    }}
                        onClick={() => onSelectSymbol(item.symbol)}
                        onMouseOver={(e) => { if (item.symbol !== currentSymbol) e.currentTarget.style.background = '#2a2e39' }}
                        onMouseOut={(e) => { if (item.symbol !== currentSymbol) e.currentTarget.style.background = 'transparent' }}
                    >
                        <div style={{ color: '#d1d4dc' }}>{item.symbol}</div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#d1d4dc' }}>{item.price}</div>
                            <div style={{
                                color: item.change.startsWith('+') ? '#089981' : '#f23645',
                                fontSize: '12px'
                            }}>
                                {item.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
