import { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";

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
    max-width: 560px;
    height: min(480px, 80vh);
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
  @keyframes pulse { 50% { opacity: 0.3; } }

  .ttl { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .ttl.expiring { color: var(--red); }

  .header-right { margin-left: auto; }
  .kill-btn {
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

  .output {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px;
    font-size: 12.5px;
    line-height: 1.7;
    white-space: pre-wrap;
  }
  .output::-webkit-scrollbar { width: 4px; }
  .output::-webkit-scrollbar-thumb { background: var(--border); }

  .line.system { color: var(--muted); }
  .line.error { color: var(--red); }

  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .prompt { color: var(--green); }
  .input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-family: var(--mono);
    font-size: 12.5px;
    caret-color: var(--green);
  }
  .input::placeholder { color: var(--muted); }

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

export default function App() {
  const [session, setSession] = useState(null); // { id, status, remaining }
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef(null);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (session?.status === "running") inputRef.current?.focus();
  }, [session]);

  // TTL countdown
  useEffect(() => {
    if (!session || session.status !== "running") return;
    const t = setInterval(() => {
      setSession(s => {
        if (!s) return s;
        const remaining = s.remaining - 1;
        if (remaining <= 0) {
          wsRef.current?.close();
          return { ...s, remaining: 0, status: "expired" };
        }
        return { ...s, remaining, status: remaining <= 60 ? "expiring" : "running" };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [session?.status === "running"]);

  const appendLine = useCallback((text, type = "output") => {
    setLines(prev => [...prev, { text, type }]);
  }, []);

  const startSession = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: "POST" });
      const data = await res.json();

      const id = data.id;
      setSession({ id, status: "running", remaining: TTL });
      setLines([]);

      const ws = new WebSocket(`${WS_BASE}/sessions/${id}`);
      wsRef.current = ws;

      ws.onmessage = e => appendLine(e.data);
      ws.onclose = () => {
        setSession(s => (s ? { ...s, status: "expired" } : s));
      };
      ws.onerror = () => appendLine("connection error", "error");
    } catch {
      appendLine("failed to create session", "error");
    } finally {
      setConnecting(false);
    }
  }, [appendLine]);

  const killSession = useCallback(() => {
    wsRef.current?.close();
    setSession(s => (s ? { ...s, status: "expired" } : s));
  }, []);

  const sendCommand = useCallback(() => {
    const cmd = input.trim();
    setInput("");
    if (!cmd || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(cmd);
  }, [input]);

  const handleKey = e => {
    if (e.key === "Enter") sendCommand();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <span className="logo">docpine</span>
          {session && (
            <>
              <span className={`status-dot ${session.status}`} />
              <span className={`ttl ${session.status === "expiring" ? "expiring" : ""}`}>
                {fmtTTL(session.remaining)}
              </span>
            </>
          )}
          <div className="header-right">
            {session && session.status !== "expired" && (
              <button className="kill-btn" onClick={killSession}>kill</button>
            )}
          </div>
        </div>

        {session ? (
          <>
            <div className="output" ref={outputRef}>
              {lines.map((l, i) => (
                <div key={i} className={`line ${l.type}`}>{l.text}</div>
              ))}
            </div>
            <div className="input-row">
              <span className="prompt">❯</span>
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                spellCheck={false}
                autoComplete="off"
                disabled={session.status === "expired"}
              />
            </div>
          </>
        ) : (
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