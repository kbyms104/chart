import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LeftToolbar } from './components/LeftToolbar';
import { RightPanel } from './components/RightPanel';
import { TradingViewChart } from './components/TradingViewChart';
import { ErrorBoundary } from './components/ErrorBoundary';
import { defaultChartSettings } from './components/SettingsMenu';
import type { ChartSettings } from './components/SettingsMenu';
import type { DataPoint } from './types';
import { calculateSMA, calculateEMA } from './indicators/MovingAverage';
import { calculateRSI } from './indicators/RSI';
import { calculateMACD } from './indicators/MACD';
import { calculateBollingerBands } from './indicators/BollingerBands';
import { calculateStochastic } from './indicators/Stochastic';
import { calculateATR } from './indicators/ATR';
import { calculateADX } from './indicators/ADX';
import { calculateIchimoku } from './indicators/Ichimoku';
import { calculateParabolicSAR } from './indicators/ParabolicSAR';
import type { DrawingType } from './utils/drawingUtils';
import html2canvas from 'html2canvas';

function generateData(count: number, timeframe: string): DataPoint[] {
  const data: DataPoint[] = [];
  let time = new Date('2023-01-01').getTime();
  let price = 100;

  let interval = 60 * 60 * 1000; // Default 1h
  if (timeframe === '1m') interval = 60 * 1000;
  else if (timeframe === '5m') interval = 5 * 60 * 1000;
  else if (timeframe === '15m') interval = 15 * 60 * 1000;
  else if (timeframe === '1h') interval = 60 * 60 * 1000;
  else if (timeframe === '4h') interval = 4 * 60 * 60 * 1000;
  else if (timeframe === '1d') interval = 24 * 60 * 60 * 1000;
  else if (timeframe === '1w') interval = 7 * 24 * 60 * 60 * 1000;
  else if (timeframe === 'M') interval = 30 * 24 * 60 * 60 * 1000;
  else if (timeframe === 'Y') interval = 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const open = price;
    const high = price + Math.random() * 5;
    const low = price - Math.random() * 5;
    const close = low + Math.random() * (high - low);

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000
    });

    price = close;
    time += interval;
  }
  return data;
}


function generateHistoryData(count: number, timeframe: string, firstTime: number, firstOpen: number): DataPoint[] {
  const data: DataPoint[] = [];
  let currentTime = firstTime;
  let currentPrice = firstOpen;

  let interval = 60 * 60 * 1000; // Default 1h
  if (timeframe === '1m') interval = 60 * 1000;
  else if (timeframe === '5m') interval = 5 * 60 * 1000;
  else if (timeframe === '15m') interval = 15 * 60 * 1000;
  else if (timeframe === '1h') interval = 60 * 60 * 1000;
  else if (timeframe === '4h') interval = 4 * 60 * 60 * 1000;
  else if (timeframe === '1d') interval = 24 * 60 * 60 * 1000;
  else if (timeframe === '1w') interval = 7 * 24 * 60 * 60 * 1000;
  else if (timeframe === 'M') interval = 30 * 24 * 60 * 60 * 1000;
  else if (timeframe === 'Y') interval = 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    currentTime -= interval;
    const close = currentPrice;
    // Random walk backwards
    const change = (Math.random() - 0.5) * 10;
    const open = close - change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    data.unshift({
      time: currentTime,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000
    });

    currentPrice = open;
  }
  return data;
}

function App() {
  const [currentTimeframe, setCurrentTimeframe] = useState('1h');
  const [currentChartType, setCurrentChartType] = useState<'candle' | 'line'>('candle');
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    'main-series': true,
    'sma-20': false,
    'ema-20': false,
    'bb': false,
    'rsi': true,
    'macd': true,
    'stoch': false,
    'atr': false,
    'adx': false,
    'ichimoku': false,
    'sar': false
  });

  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(defaultChartSettings);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleToggleSeries = (seriesId: string) => {
    setVisibleSeries(prev => ({
      ...prev,
      [seriesId]: !prev[seriesId]
    }));
  };

  const handleTimeframeChange = (tf: string) => {
    setCurrentTimeframe(tf);
  };

  const handleChartTypeChange = (type: 'candle' | 'line') => {
    setCurrentChartType(type);
  };

  const handleSymbolChange = (symbol: string) => {
    setCurrentSymbol(symbol);
  };

  const handleToolChange = (tool: DrawingType | null) => {
    setActiveTool(tool);
  };

  const [isMagnetMode, setIsMagnetMode] = useState<boolean>(false);
  const toggleMagnetMode = () => {
    setIsMagnetMode(!isMagnetMode);
  };

  const handleDeleteDrawing = (id: string) => {
    console.log('Deleted drawing:', id);
  };

  const handleDrawingComplete = () => {
    setActiveTool(null);
  };

  const handleScreenshot = async () => {
    if (chartContainerRef.current) {
      try {
        const canvas = await html2canvas(chartContainerRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0d1117',
        });
        const link = document.createElement('a');
        link.download = `chart-${currentSymbol}-${currentTimeframe}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
    }
  };

  const calculateIndicators = (data: DataPoint[]) => {
    const sma20 = calculateSMA(data, 20);
    const ema20 = calculateEMA(data, 20);
    const rsi = calculateRSI(data, 14);
    const bb = calculateBollingerBands(data, 20, 2);
    const macd = calculateMACD(data);
    const stoch = calculateStochastic(data);
    const atr = calculateATR(data);
    const adx = calculateADX(data);
    const ichimoku = calculateIchimoku(data);
    const sar = calculateParabolicSAR(data);

    return data.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      ema20: ema20[i],
      rsi: rsi[i],
      bb_upper: bb.upper[i],
      bb_lower: bb.lower[i],
      macd_line: macd.macdLine[i],
      macd_signal: macd.signalLine[i],
      macd_hist: macd.histogram[i],
      stoch_k: stoch.k[i],
      stoch_d: stoch.d[i],
      atr: atr[i],
      adx: adx.adx[i],
      di_plus: adx.plusDI[i],
      di_minus: adx.minusDI[i],
      tenkan_sen: ichimoku.tenkanSen[i],
      kijun_sen: ichimoku.kijunSen[i],
      senkou_span_a: ichimoku.senkouSpanA[i],
      senkou_span_b: ichimoku.senkouSpanB[i],
      chikou_span: ichimoku.chikouSpan[i],
      sar: sar[i]
    }));
  };

  const handleLoadMoreHistory = () => {
    if (chartData.length === 0) return;

    const firstPoint = chartData[0];
    const newHistory = generateHistoryData(100, currentTimeframe, firstPoint.time as number, firstPoint.open);

    // Combine and recalculate indicators
    // Note: We need to strip existing indicators from chartData to avoid confusion, or just use raw properties if we had them separate.
    // Since chartData already has indicators, we can just take the raw parts.
    // But calculateIndicators expects DataPoint which has optional indicator fields. It's fine.

    const combinedRaw = [...newHistory, ...chartData];
    // We need to recalculate indicators for the whole set to ensure continuity (EMA, RSI etc depend on history)
    const newDataWithIndicators = calculateIndicators(combinedRaw);

    console.log('Loaded history. New length:', newDataWithIndicators.length);
    setChartData(newDataWithIndicators);
  };

  // Generate initial data with indicators
  useEffect(() => {
    console.time('DataGeneration');
    const rawData = generateData(500, currentTimeframe);
    console.timeEnd('DataGeneration');

    console.time('IndicatorCalculation');
    const dataWithIndicators = calculateIndicators(rawData);
    console.timeEnd('IndicatorCalculation');

    setChartData(dataWithIndicators);
  }, [currentTimeframe]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 1fr 300px',
      gridTemplateRows: '50px 1fr',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0d1117',
      color: '#d1d4dc',
      overflow: 'hidden'
    }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <Header
          visibleSeries={visibleSeries}
          onToggleSeries={handleToggleSeries}
          currentTimeframe={currentTimeframe}
          onTimeframeChange={handleTimeframeChange}
          currentChartType={currentChartType}
          onChartTypeChange={handleChartTypeChange}
          currentSymbol={currentSymbol}
          chartSettings={chartSettings}
          onChartSettingsChange={setChartSettings}
          onScreenshot={handleScreenshot}
        />
      </div>

      <div style={{ gridColumn: '1 / 2' }}>
        <LeftToolbar
          activeTool={activeTool}
          onSelectTool={handleToolChange}
          isMagnetMode={isMagnetMode}
          onToggleMagnet={toggleMagnetMode}
        />
      </div>

      <div ref={chartContainerRef} style={{ gridColumn: '2 / 3', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
        <ErrorBoundary>
          <TradingViewChart
            data={chartData}
            visibleSeries={visibleSeries}
            chartSettings={chartSettings}
            activeTool={activeTool}
            isMagnetMode={isMagnetMode}
            onDeleteDrawing={handleDeleteDrawing}
            onDrawingComplete={handleDrawingComplete}
            onLoadMoreHistory={handleLoadMoreHistory}
          />
        </ErrorBoundary>
      </div>

      <div style={{ gridColumn: '3 / 4' }}>
        <RightPanel
          currentSymbol={currentSymbol}
          onSelectSymbol={handleSymbolChange}
        />
      </div>
    </div>
  );
}

export default App;
