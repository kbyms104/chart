import type { DrawingType } from '../utils/drawingUtils';

interface Props {
    activeTool: DrawingType | null;
    onSelectTool: (tool: DrawingType | null) => void;
    isMagnetMode: boolean;
    onToggleMagnet: () => void;
}

export const LeftToolbar: React.FC<Props> = ({ activeTool, onSelectTool, isMagnetMode, onToggleMagnet }) => {
    const tools: { id: DrawingType; icon: string; label: string }[] = [
        { id: 'crosshair', icon: '⊕', label: 'Crosshair' },
        { id: 'trend-line', icon: '∕', label: 'Trend Line' },
        { id: 'fibonacci', icon: '⫚', label: 'Fib Retracement' },
        { id: 'text', icon: 'T', label: 'Text' },
        { id: 'rectangle', icon: '▭', label: 'Rectangle' },
        { id: 'measure', icon: '📏', label: 'Measure' },
        { id: 'brush', icon: '🖌️', label: 'Brush' },
        { id: 'elliott-wave', icon: '🌊', label: 'Elliott Wave (12345)' },
        { id: 'pitchfork', icon: 'Ψ', label: 'Pitchfork' },
        { id: 'long-position', icon: '📈', label: 'Long Position' },
        { id: 'short-position', icon: '📉', label: 'Short Position' },
        { id: 'zoom', icon: '🔍', label: 'Zoom' },
        // Magnet is handled separately
        { id: 'icon', icon: '☺', label: 'Icon' }
    ];

    return (
        <div style={{
            width: '50px',
            backgroundColor: '#131722',
            borderRight: '1px solid #2a2e39',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '10px',
            gap: '16px'
        }}>
            {tools.map((tool) => (
                <button key={tool.id}
                    onClick={() => onSelectTool(activeTool === tool.id ? null : tool.id)}
                    title={tool.label}
                    style={{
                        background: activeTool === tool.id ? '#2962ff' : 'transparent',
                        border: 'none',
                        color: activeTool === tool.id ? 'white' : '#d1d4dc',
                        fontSize: '20px',
                        cursor: 'pointer',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => { if (activeTool !== tool.id) e.currentTarget.style.background = '#2a2e39' }}
                    onMouseOut={(e) => { if (activeTool !== tool.id) e.currentTarget.style.background = 'transparent' }}
                >
                    {tool.icon}
                </button>
            ))}

            <div style={{ width: '30px', height: '1px', backgroundColor: '#2a2e39', margin: '4px 0' }} />

            <button
                onClick={onToggleMagnet}
                title="Magnet Mode"
                style={{
                    background: isMagnetMode ? '#2962ff' : 'transparent',
                    border: 'none',
                    color: isMagnetMode ? 'white' : '#d1d4dc',
                    fontSize: '20px',
                    cursor: 'pointer',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { if (!isMagnetMode) e.currentTarget.style.background = '#2a2e39' }}
                onMouseOut={(e) => { if (!isMagnetMode) e.currentTarget.style.background = 'transparent' }}
            >
                🧲
            </button>
        </div>
    );
};
