# PitWall Pro

A professional-grade F1 race strategy decision support system. Features real-time Monte Carlo race simulation, tire degradation modeling, and AI-powered strategy explanations using Gemini.

## Features

- **Real-time Monte Carlo Simulation**: Predict race outcomes based on tire degradation and pit stop strategies.
- **AI Strategy Analysis**: Get detailed strategy explanations powered by Google Gemini.
- **3D Track Map**: Visualize the circuit layout.
- **Driver Management**: Manage driver profiles and performance data.
- **Telemetry Analysis**: View real-time telemetry data.

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    - Copy `.env.example` to `.env`
    - Add your Gemini API Key.
4.  Start the development server:
    ```bash
    npm run dev
    ```

## Deployment

To build for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## License

MIT
