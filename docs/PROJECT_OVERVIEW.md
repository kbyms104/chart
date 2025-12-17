# Project Overview

This project is a React-based financial charting application designed to mimic the core functionalities of TradingView. It leverages `lightweight-charts` for high-performance rendering and provides a rich set of features for technical analysis.

## Key Features

*   **Interactive Charts**: High-performance candlestick and line charts.
*   **Multi-Timeframe Support**: Seamless switching between 1m, 5m, 15m, 1h, 4h, 1D, and 1W timeframes.
*   **Technical Indicators**: A comprehensive suite of indicators including:
    *   Moving Averages (SMA, EMA)
    *   Bollinger Bands
    *   RSI (Relative Strength Index)
    *   MACD (Moving Average Convergence Divergence)
    *   Stochastic Oscillator
    *   ATR (Average True Range)
    *   ADX (Average Directional Index)
    *   Ichimoku Cloud
    *   Parabolic SAR
*   **Drawing Tools**: A variety of tools for chart annotation:
    *   Trend Line, Horizontal Line, Rectangle
    *   Fibonacci Retracement
    *   Text, Marker, Icon
    *   Measure Tool
    *   Brush (Freehand drawing)
    *   Elliott Wave (12345 Impulse)
    *   Pitchfork
    *   Long/Short Position Tools (with risk/reward calculation)
*   **Magnet Mode**: Snaps drawing points to the nearest OHLC values for precision.
*   **Infinite Scroll**: Automatically loads historical data as you scroll back in time.
*   **Chart Settings**: Customizable grid, crosshair labels, and price labels.
*   **Screenshot**: Capture and save the current chart view as an image.

## UI Guide & Buttons

### Header (Top Bar)

*   **Symbol Info**: Displays the current symbol (e.g., AAPL).
*   **Timeframe Buttons**: `1m`, `5m`, `15m`, `1h`, `4h`, `D`, `W` - Click to change the chart interval.
*   **Chart Type**:
    *   🕯 (Candle): Switch to candlestick chart.
    *   📈 (Line): Switch to line chart.
*   **Indicators (fx)**: Opens a dropdown menu to toggle various technical indicators on/off.
*   **Settings (⚙️)**: Opens the chart settings menu to toggle:
    *   OHLC Info
    *   Indicator Values
    *   Last Price Label
    *   Indicator Labels
    *   Crosshair Labels
    *   Grid
    *   Volume
*   **Screenshot (📷)**: Captures the current chart and downloads it as a PNG file.

### Left Toolbar (Drawing Tools)

*   **⊕ (Crosshair)**: Default cursor mode.
*   **∕ (Trend Line)**: Draw straight lines.
*   **⫚ (Fib Retracement)**: Draw Fibonacci retracement levels.
*   **T (Text)**: Add text annotations.
*   **▭ (Rectangle)**: Draw rectangles.
*   **📏 (Measure)**: Measure price and time distance between two points.
*   **🖌️ (Brush)**: Freehand drawing.
*   **🌊 (Elliott Wave)**: Draw Elliott Wave 1-2-3-4-5 patterns.
*   **Ψ (Pitchfork)**: Draw Andrews' Pitchfork.
*   **📈 (Long Position)**: Tool to plan long trades (Entry, Stop Loss, Take Profit).
*   **📉 (Short Position)**: Tool to plan short trades.
*   **🔍 (Zoom)**: Zoom tool (functionality may vary).
*   **☺ (Icon)**: Place icons on the chart.
*   **🧲 (Magnet Mode)**: Toggle magnet mode. When active, drawing points snap to the nearest Open/High/Low/Close price.

### Right Panel

*   **Watchlist**: Displays a list of symbols. Click on a symbol to change the chart data.

## Technical Stack

*   **Frontend Framework**: React 19
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **Charting Library**: `lightweight-charts` (TradingView)
*   **Styling**: CSS Modules / Inline Styles
*   **Utilities**: `html2canvas` (for screenshots)
