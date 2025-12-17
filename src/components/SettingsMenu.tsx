import React from 'react';

export interface ChartSettings {
    showOHLC: boolean;             // OHLC 정보 (좌상단)
    showIndicatorValues: boolean;  // 지표 값 (좌상단)
    showIndicatorPriceLabels: boolean; // 보조지표 Y축 라벨 (오른쪽)
    showLastPriceLabel: boolean;   // 현재가 Y축 라벨 (오른쪽)
    showCrosshairLabels: boolean;  // 크로스헤어 라벨
    showGrid: boolean;
    showVolume: boolean;
}

interface Props {
    settings: ChartSettings;
    onSettingsChange: (settings: ChartSettings) => void;
    onClose: () => void;
}

export const SettingsMenu: React.FC<Props> = ({ settings, onSettingsChange, onClose }) => {
    const toggleSetting = (key: keyof ChartSettings) => {
        onSettingsChange({
            ...settings,
            [key]: !settings[key]
        });
    };

    const options = [
        { key: 'showOHLC' as const, label: 'OHLC 정보 (좌상단)' },
        { key: 'showIndicatorValues' as const, label: '보조지표 값 (좌상단)' },
        { key: 'showLastPriceLabel' as const, label: '현재가 Y축 라벨' },
        { key: 'showIndicatorPriceLabels' as const, label: '보조지표 Y축 라벨' },
        { key: 'showCrosshairLabels' as const, label: '십자선 라벨' },
        { key: 'showGrid' as const, label: '그리드' },
        { key: 'showVolume' as const, label: '거래량' },
    ];

    return (
        <div style={{
            position: 'absolute',
            top: '50px',
            right: '100px',
            backgroundColor: '#1e222d',
            border: '1px solid #2a2e39',
            borderRadius: '4px',
            padding: '8px 0',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            minWidth: '220px'
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
                <span>⚙️ 차트 설정</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '8px 0' }}>
                {options.map(opt => (
                    <div key={opt.key}
                        onClick={() => toggleSetting(opt.key)}
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
                            checked={settings[opt.key]}
                            readOnly
                            style={{ cursor: 'pointer', accentColor: '#2962ff' }}
                        />
                        <span style={{ fontSize: '14px' }}>{opt.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const defaultChartSettings: ChartSettings = {
    showOHLC: true,
    showIndicatorValues: true,
    showIndicatorPriceLabels: true,
    showLastPriceLabel: true,
    showCrosshairLabels: true,
    showGrid: true,
    showVolume: true,
};
