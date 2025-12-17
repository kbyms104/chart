# Getting Started

This guide will help you set up and run the project locally.

## Prerequisites

Before you begin, ensure you have the following installed:
*   **Node.js** (v18 or higher recommended)
*   **npm** (usually comes with Node.js) or **yarn**

## Installation

1.  **Clone the repository** (if applicable) or download the source code.
    ```bash
    git clone <repository-url>
    cd chart
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

## Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the application, usually at `http://localhost:5173`. Open this URL in your browser to view the chart.

## Building for Production

To create a production-ready build:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory. You can preview the production build using:

```bash
npm run preview
```

## Project Structure

*   `src/`: Source code
    *   `components/`: React components (Chart, Header, Toolbar, etc.)
    *   `indicators/`: Logic for calculating technical indicators.
    *   `utils/`: Helper functions (drawing logic, data formatting).
    *   `App.tsx`: Main application component.
    *   `types.ts`: TypeScript type definitions.
*   `docs/`: Project documentation.

## Usage Tips

*   **Scrolling**: Use the mouse wheel or trackpad to scroll back in time. The chart will automatically load more history.
*   **Zooming**: Use `Ctrl` + Scroll (or pinch gesture) to zoom in/out.
*   **Drawing**: Select a tool from the left toolbar and click on the chart to draw. Right-click on a drawing to delete it (if implemented) or use the delete function.
*   **Magnet Mode**: Enable the magnet icon (🧲) to easily snap your drawings to candle wicks or bodies.
