# Docpine UI

Ephemeral, isolated container terminal in your browser with real-time WebSocket PTY streaming.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)
Copy the example environment configuration if you need custom backend URLs:
```bash
cp .env.local.example .env.local
```
- `NEXT_PUBLIC_API_BASE`: Docpine HTTP backend URL (default: `http://127.0.0.1:8080`)
- `NEXT_PUBLIC_WS_BASE`: Docpine WebSocket streaming URL (default: `ws://127.0.0.1:8080`)

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev`: Start Next.js development server
- `npm run build`: Build production application
- `npm run start`: Start production server
- `npm run lint`: Run code linter (`oxlint`)
