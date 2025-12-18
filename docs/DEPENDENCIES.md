# Project Dependencies

This document lists all the packages required to run and develop this project, along with their versions as specified in `package.json`.

## Runtime Dependencies

These packages are essential for the application to run in the browser.

| Package | Version | Description |
| :--- | :--- | :--- |
| **react** | `^19.2.0` | The core React library for building user interfaces. |
| **react-dom** | `^19.2.0` | React package for working with the DOM. |
| **lightweight-charts** | `^5.0.9` | High-performance financial charting library by TradingView. |
| **html2canvas** | `^1.4.1` | Library to take screenshots of the chart by converting DOM to canvas. |

## Development Dependencies

These packages are used for development, building, and testing the application.

| Package | Version | Description |
| :--- | :--- | :--- |
| **vite** | `^7.2.4` | Next Generation Frontend Tooling (Build tool & Dev server). |
| **typescript** | `~5.9.3` | TypeScript language support. |
| **@vitejs/plugin-react** | `^5.1.1` | Vite plugin for React Fast Refresh. |
| **eslint** | `^9.39.1` | Pluggable JavaScript linter. |
| **@types/react** | `^19.2.5` | TypeScript definitions for React. |
| **@types/react-dom** | `^19.2.3` | TypeScript definitions for React DOM. |
| **@types/node** | `^24.10.1` | TypeScript definitions for Node.js. |
| **@types/html2canvas** | `^0.5.35` | TypeScript definitions for html2canvas. |
| **typescript-eslint** | `^8.46.4` | Tooling which enables ESLint to support TypeScript. |

## Node.js Version

*   **Recommended**: Node.js v18 or higher.

## How to Install

You don't need to install these manually one by one. Just run:

```bash
npm install
```

This command reads `package.json` and installs all the correct versions automatically.
