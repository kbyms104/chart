import React, { useState } from 'react';
import { IndicatorMenu } from './IndicatorMenu';
import { SettingsMenu } from './SettingsMenu';
import type { ChartSettings } from './SettingsMenu';

interface Props {
    visibleSeries: Record<string, boolean>;
    onToggleSeries: (id: string) => void;
    currentTimeframe: string;
    onTimeframeChange: (tf: string) => void;
    currentChartType: 'candle' | 'line';
    onChartTypeChange: (type: 'candle' | 'line') => void;
    currentSymbol: string;
    chartSettings: ChartSettings;
    onChartSettingsChange: (settings: ChartSettings) => void;
    onScreenshot: () => void;
}

export const Header: React.FC<Props> = ({
    visibleSeries,
    onToggleSeries,
    currentTimeframe,
    onTimeframeChange,
    currentChartType,
    onChartTypeChange,
    currentSymbol,
    chartSettings,
    onChartSettingsChange,
    onScreenshot
}) => {
    const [showIndicators, setShowIndicators] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div style={{
            height: '50px',
            backgroundColor: '#131722',
            borderBottom: '1px solid #2a2e39',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            color: '#d1d4dc',
            fontSize: '14px',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Symbol Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{currentSymbol}</div>
                    <div style={{ fontSize: '12px', color: '#787b86' }}>Stock</div>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#2a2e39' }}></div>

                {/* Timeframes */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['1m', '5m', '15m', '1h', '4h', 'D', 'W', 'M', 'Y'].map(tf => (
                        <button key={tf}
                            onClick={() => onTimeframeChange(tf)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: tf === currentTimeframe ? '#2962ff' : '#d1d4dc',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontWeight: tf === currentTimeframe ? 'bold' : 'normal'
                            }}>
                            {tf}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#2a2e39' }}></div>

                {/* Chart Type */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => onChartTypeChange('candle')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentChartType === 'candle' ? '#2962ff' : '#d1d4dc',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                        title="Candles"
                    >
                        🕯
                    </button>
                    <button
                        onClick={() => onChartTypeChange('line')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentChartType === 'line' ? '#2962ff' : '#d1d4dc',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                        title="Line"
                    >
                        📈
                    </button>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#2a2e39' }}></div>

                {/* Indicators Button */}
                <button
                    onClick={() => setShowIndicators(!showIndicators)}
                    style={{
                        background: showIndicators ? '#2a2e39' : 'transparent',
                        border: 'none',
                        color: showIndicators ? '#2962ff' : '#d1d4dc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px'
                    }}
                >
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>fx</span>
                    <span>Indicators</span>
                </button>

                {/* Indicator Menu Dropdown */}
                {showIndicators && (
                    <IndicatorMenu
                        visibleSeries={visibleSeries}
                        onToggleSeries={onToggleSeries}
                        onClose={() => setShowIndicators(false)}
                    />
                )}
            </div>

            {/* Right Side */}
            <div style={{ display: 'flex', gap: '16px' }}>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        background: showSettings ? '#2a2e39' : 'transparent',
                        border: 'none',
                        color: showSettings ? '#2962ff' : '#d1d4dc',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        padding: '4px 8px'
                    }}
                >
                    ⚙️
                </button>
                <button
                    onClick={onScreenshot}
                    style={{ background: 'transparent', border: 'none', color: '#d1d4dc', cursor: 'pointer' }}
                >
                    📷
                </button>
            </div>

            {/* Settings Menu */}
            {showSettings && (
                <SettingsMenu
                    settings={chartSettings}
                    onSettingsChange={onChartSettingsChange}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
};
