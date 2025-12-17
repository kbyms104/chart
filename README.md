# TradingView-like Chart System

A high-performance, extensible financial chart built with React, TypeScript, and HTML5 Canvas.

## Features

- **High Performance**: Renders thousands of data points at 60fps using HTML5 Canvas.
- **Interactive**: Smooth Zooming (Mouse Wheel) and Panning (Drag).
- **Extensible Data Layer**: Supports arbitrary data fields via `DataManager` and `fieldMapping`.
- **Multiple Indicators**: Overlay multiple series (Candles, Lines) on the same chart.
- **UI Controls**: Toggle chart types and indicator visibility.

## Architecture

- **ChartEngine**: Core rendering loop and event handling.
- **ScaleManager**: Coordinate transformations (Time/Price <-> Pixels).
- **DataManager**: Centralized data store supporting multiple series.
- **Renderers**: Modular renderers for different series types (`CandleRenderer`, `LineRenderer`).

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` (or the port shown in terminal).

## Usage

- **Pan**: Click and drag the chart area.
- **Zoom**: Scroll up/down with the mouse wheel.
- **Toggle Indicators**: Use the control panel in the top-left corner.
