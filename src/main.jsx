import { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const TTL = 300; // seconds
const API_BASE = "http://localhost:8080";
const WS_BASE = "ws://localhost:8080";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0d0d;
    --surface: #141414;
    --border: #262626;
    --green: #00ff88;
    --red: #ff4455;
    --muted: #666;
    --text: #d8d8d8;
    --mono: 'JetBrains Mono', monospace;
  }

  html, body, #root { height: 100%; color: var(--text); font-family: var(--mono); font-size: 13px; }
  html, body { background: var(--bg); }
  #root {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)),
      url('/static/assets/background.jpg') center / cover no-repeat fixed;
  }

  .app {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 640px;
    height: min(520px, 80vh);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }
  .logo { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
  .status-dot.running { background: var(--green); }
  .status-dot.expiring { background: var(--red); animation: pulse 1s infinite; }
  .status-dot.expired { background: var(--muted); }
  @keyframes pulse { 50% { opacity: 0.3; } }

  .ttl { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .ttl.expiring { color: var(--red); }

  .status-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }

  .header-right { margin-left: auto; display: flex; gap: 8px; }
  .kill-btn, .reconnect-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--mono);
    font-size: 11px;
    padding: 4px 10px;
    cursor: pointer;
    border-radius: 3px;
  }
  .kill-btn:hover { border-color: var(--red); color: var(--red); }
  .reconnect-btn { border-color: var(--green); color: var(--green); }
  .reconnect-btn:hover { background: #00ff8815; }
  .reconnect-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .term-wrap {
    flex: 1;
    min-height: 0;
    padding: 10px 12px 0;
    position: relative;
  }
  .term-wrap .xterm { height: 100%; }
  .term-wrap .xterm-viewport::-webkit-scrollbar { width: 4px; }
  .term-wrap .xterm-viewport::-webkit-scrollbar-thumb { background: var(--border); }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(13, 13, 13, 0.85);
    text-align: center;
  }
  .overlay-msg { font-size: 12px; color: var(--muted); }

  .empty { flex: 1; display: flex; align-items: center; justify-content: center; }
  .start-btn {
    background: none;
    border: 1px solid var(--green);
    color: var(--green);
    font-family: var(--mono);
    font-size: 12px;
    padding: 8px 18px;
    cursor: pointer;
    border-radius: 3px;
  }
  .start-btn:hover { background: #00ff8815; }
  .start-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;

function fmtTTL(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const XTERM_THEME = {
  background: "#141414",
  foreground: "#d8d8d8",
  cursor: "#00ff88",
  cursorAccent: "#141414",
  selectionBackground: "#00ff8833",
  black: "#141414",
  red: "#ff4455",
  green: "#00ff88",
  yellow: "#ffaa00",
  blue: "#5599ff",
  magenta: "#cc88ff",
  cyan: "#55ddff",
  white: "#d8d8d8",
  brightBlack: "#666666",
};

export default function App() {
  // status: idle | running | expiring | expired
  const [session, setSession] = useState(null); // { id, status, remaining }
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const termContainerRef = useRef(null);
  const manualCloseRef = useRef(false);

  // --- terminal lifecycle: created once, reused across reconnects ---
  useEffect(() => {
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      theme: XTERM_THEME,
      scrollback: 5000,
      convertEol: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);
    fitAddon.fit();

    term.onData(data => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      }
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const onResize = () => fitAddonRef.current?.fit();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(termContainerRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      term.dispose();
    };
  }, []);

  // re-fit whenever the terminal becomes visible (display:none has zero dimensions,
  // so fit() calls made while hidden are no-ops)
  useEffect(() => {
    if (session) requestAnimationFrame(() => fitAddonRef.current?.fit());
  }, [!!session]);

  // TTL countdown — only ticks while actually attached
  useEffect(() => {
    if (!session || (session.status !== "running" && session.status !== "expiring")) return;
    const t = setInterval(() => {
      setSession(s => {
        if (!s) return s;
        const remaining = s.remaining - 1;
        if (remaining <= 0) {
          manualCloseRef.current = true; // expected close, don't trigger auto-reconnect UI
          wsRef.current?.close();
          termRef.current?.writeln("\r\n\x1b[90m[session expired]\x1b[0m");
          return { ...s, remaining: 0, status: "expired" };
        }
        return { ...s, remaining, status: remaining <= 60 ? "expiring" : "running" };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [session?.status]);

  const attach = useCallback((id, remaining) => {
    manualCloseRef.current = false;
    const ws = new WebSocket(`${WS_BASE}/sessions/${id}/attach`);
    wsRef.current = ws;

    ws.onopen = () => {
      setSession({ id, status: remaining <= 60 ? "expiring" : "running", remaining });
      fitAddonRef.current?.fit();
    };
    ws.onmessage = e => termRef.current?.write(e.data);
    ws.onclose = () => {
      if (manualCloseRef.current) return; // kill or TTL expiry already handled state
      // any drop (network blip, server restart, etc.) — reconnect always spins up a new container
      termRef.current?.writeln("\r\n\x1b[33m[disconnected — reconnect to start a new session]\x1b[0m");
      setSession(s => (s ? { ...s, status: "expired" } : s));
    };
    ws.onerror = () => termRef.current?.writeln("\r\n\x1b[31m[connection error]\x1b[0m");
  }, []);

  const startSession = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: "POST" });
      const data = await res.json();
      termRef.current?.clear();
      termRef.current?.reset();
      attach(data.container_id, TTL);
    } catch {
      termRef.current?.writeln("\x1b[31mfailed to create session\x1b[0m");
    } finally {
      setConnecting(false);
    }
  }, [attach]);

  // any reconnect — whether from TTL expiry or a dropped connection — spins up a new container
  const reconnect = useCallback(() => {
    startSession();
  }, [startSession]);

  const killSession = useCallback(() => {
    manualCloseRef.current = true;
    wsRef.current?.close();
    setSession(s => (s ? { ...s, status: "expired" } : s));
  }, []);

  const showOverlay = session && session.status === "expired";

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <span className="logo">docpine</span>
          {session && (
            <>
              <span className={`status-dot ${session.status}`} />
              {session.status === "running" || session.status === "expiring" ? (
                <span className={`ttl ${session.status === "expiring" ? "expiring" : ""}`}>
                  {fmtTTL(session.remaining)}
                </span>
              ) : (
                <span className="status-label">{session.status}</span>
              )}
            </>
          )}
          <div className="header-right">
            {session && (session.status === "running" || session.status === "expiring") && (
              <button className="kill-btn" onClick={killSession}>kill</button>
            )}
            {session && session.status === "expired" && (
              <button className="reconnect-btn" onClick={reconnect} disabled={connecting}>
                {connecting ? "reconnecting..." : "reconnect"}
              </button>
            )}
          </div>
        </div>

        {/* term-wrap is always mounted so the xterm instance (created once in the
            effect above) never gets detached — visibility toggles via overlays */}
        <div className="term-wrap" ref={termContainerRef} style={{ display: session ? "block" : "none" }}>
          {showOverlay && (
            <div className="overlay">
              <span className="overlay-msg">session ended — reconnect to start a new one</span>
              <button className="reconnect-btn" onClick={reconnect} disabled={connecting}>
                {connecting ? "reconnecting..." : "reconnect"}
              </button>
            </div>
          )}
        </div>
        {!session && (
          <div className="empty">
            <button className="start-btn" onClick={startSession} disabled={connecting}>
              {connecting ? "starting..." : "start session"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);