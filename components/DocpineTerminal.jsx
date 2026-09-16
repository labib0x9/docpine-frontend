"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import ErrorBoundary from "./ErrorBoundary";
import TurnstileWidget from "./TurnstileWidget";

// ============================================================================
// CONFIGURATION & THEMES
// ============================================================================
const DEFAULT_TTL = 300; // 5 minutes in seconds
const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const ENV_WS_BASE = process.env.NEXT_PUBLIC_WS_BASE;


const THEMES = {
  emerald: {
    id: "emerald",
    name: "Docpine Emerald",
    primary: "#00f5a0",
    primaryGlow: "rgba(0, 245, 160, 0.25)",
    surface: "#0e1317",
    surfaceAlt: "#141c22",
    border: "#1f2c34",
    xterm: {
      background: "#0e1317",
      foreground: "#e2ecf2",
      cursor: "#00f5a0",
      cursorAccent: "#0e1317",
      selectionBackground: "rgba(0, 245, 160, 0.25)",
      black: "#0e1317",
      red: "#ff4757",
      green: "#00f5a0",
      yellow: "#ffa502",
      blue: "#38bdf8",
      magenta: "#c084fc",
      cyan: "#22d3ee",
      white: "#f1f5f9",
      brightBlack: "#475569",
      brightRed: "#ff6b81",
      brightGreen: "#2ed573",
      brightYellow: "#eccc68",
      brightBlue: "#70a1ff",
      brightMagenta: "#e056fd",
      brightCyan: "#7bed9f",
      brightWhite: "#ffffff",
    },
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Tokyo Cyberpunk",
    primary: "#f72585",
    primaryGlow: "rgba(247, 37, 133, 0.28)",
    surface: "#0f0e17",
    surfaceAlt: "#181624",
    border: "#29243d",
    xterm: {
      background: "#0f0e17",
      foreground: "#f0eeff",
      cursor: "#f72585",
      cursorAccent: "#0f0e17",
      selectionBackground: "rgba(247, 37, 133, 0.3)",
      black: "#0f0e17",
      red: "#f72585",
      green: "#4cc9f0",
      yellow: "#fee440",
      blue: "#7209b7",
      magenta: "#b5179e",
      cyan: "#4895ef",
      white: "#f0eeff",
      brightBlack: "#56526e",
      brightRed: "#ff4d9e",
      brightGreen: "#70d6ff",
      brightYellow: "#ffeaa7",
      brightBlue: "#9d4edd",
      brightMagenta: "#d946ef",
      brightCyan: "#64dfdf",
      brightWhite: "#ffffff",
    },
  },
  dracula: {
    id: "dracula",
    name: "Dracula Midnight",
    primary: "#bd93f9",
    primaryGlow: "rgba(189, 147, 249, 0.25)",
    surface: "#181824",
    surfaceAlt: "#212130",
    border: "#323247",
    xterm: {
      background: "#181824",
      foreground: "#f8f8f2",
      cursor: "#50fa7b",
      cursorAccent: "#181824",
      selectionBackground: "rgba(189, 147, 249, 0.3)",
      black: "#21222c",
      red: "#ff5555",
      green: "#50fa7b",
      yellow: "#f1fa8c",
      blue: "#bd93f9",
      magenta: "#ff79c6",
      cyan: "#8be9fd",
      white: "#f8f8f2",
      brightBlack: "#6272a4",
      brightRed: "#ff6e6e",
      brightGreen: "#69ff94",
      brightYellow: "#ffffa5",
      brightBlue: "#d6acff",
      brightMagenta: "#ff92df",
      brightCyan: "#a4ffff",
      brightWhite: "#ffffff",
    },
  },
  amber: {
    id: "amber",
    name: "Retro CRT Amber",
    primary: "#ffb000",
    primaryGlow: "rgba(255, 176, 0, 0.25)",
    surface: "#120e06",
    surfaceAlt: "#1c160b",
    border: "#332612",
    xterm: {
      background: "#120e06",
      foreground: "#ffb000",
      cursor: "#ffcc00",
      cursorAccent: "#120e06",
      selectionBackground: "rgba(255, 176, 0, 0.3)",
      black: "#120e06",
      red: "#ff5533",
      green: "#ffb000",
      yellow: "#ffd700",
      blue: "#e69500",
      magenta: "#ff9900",
      cyan: "#ffcc33",
      white: "#ffebba",
      brightBlack: "#5c4314",
      brightRed: "#ff7755",
      brightGreen: "#ffc233",
      brightYellow: "#ffee66",
      brightBlue: "#ffaa22",
      brightMagenta: "#ffbb44",
      brightCyan: "#ffdd66",
      brightWhite: "#ffffff",
    },
  },
  solarized: {
    id: "solarized",
    name: "Solarized Dark",
    primary: "#2aa198",
    primaryGlow: "rgba(42, 161, 152, 0.25)",
    surface: "#00212b",
    surfaceAlt: "#002b36",
    border: "#073642",
    xterm: {
      background: "#00212b",
      foreground: "#93a1a1",
      cursor: "#2aa198",
      cursorAccent: "#00212b",
      selectionBackground: "rgba(42, 161, 152, 0.3)",
      black: "#073642",
      red: "#dc322f",
      green: "#859900",
      yellow: "#b58900",
      blue: "#268bd2",
      magenta: "#d33682",
      cyan: "#2aa198",
      white: "#eee8d5",
      brightBlack: "#586e75",
      brightRed: "#cb4b16",
      brightGreen: "#586e75",
      brightYellow: "#657b83",
      brightBlue: "#839496",
      brightMagenta: "#6c71c4",
      brightCyan: "#93a1a1",
      brightWhite: "#fdf6e3",
    },
  },
  obsidian: {
    id: "obsidian",
    name: "Minimal Obsidian",
    primary: "#ffffff",
    primaryGlow: "rgba(255, 255, 255, 0.2)",
    surface: "#080808",
    surfaceAlt: "#111111",
    border: "#222222",
    xterm: {
      background: "#080808",
      foreground: "#e5e5e5",
      cursor: "#ffffff",
      cursorAccent: "#080808",
      selectionBackground: "rgba(255, 255, 255, 0.25)",
      black: "#171717",
      red: "#ef4444",
      green: "#22c55e",
      yellow: "#eab308",
      blue: "#3b82f6",
      magenta: "#a855f7",
      cyan: "#06b6d4",
      white: "#f5f5f5",
      brightBlack: "#525252",
      brightRed: "#f87171",
      brightGreen: "#4ade80",
      brightYellow: "#fde047",
      brightBlue: "#60a5fa",
      brightMagenta: "#c084fc",
      brightCyan: "#22d3ee",
      brightWhite: "#ffffff",
    },
  },
};

// ============================================================================
// FORMAT HELPERS
// ============================================================================
function fmtTTL(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ============================================================================
// MAIN TERMINAL COMPONENT
// ============================================================================
export function DocpineTerminal({
  apiBaseUrl = ENV_API_BASE,
  wsBaseUrl = ENV_WS_BASE,
}) {
  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [capacityCountdown, setCapacityCountdown] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("emerald");
  const [fontSize, setFontSize] = useState(13);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState("");

  const wsRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const termContainerRef = useRef(null);
  const manualCloseRef = useRef(false);
  const appContainerRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileOverlayRef = useRef(null);

  const themeConfig = THEMES[currentTheme] || THEMES.emerald;

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------
  const showToast = useCallback((title, msg, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, title, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // --------------------------------------------------------------------------
  // NETWORK MONITORING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Network Connected", "Internet connection restored", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Network Offline", "You are disconnected from the network", "error");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showToast]);

  // --------------------------------------------------------------------------
  // RATE LIMIT COUNTDOWN TICKER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  // --------------------------------------------------------------------------
  // CAPACITY LIMIT COUNTDOWN TICKER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (capacityCountdown <= 0) return;
    const timer = setInterval(() => {
      setCapacityCountdown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [capacityCountdown]);

  // --------------------------------------------------------------------------
  // INITIALIZE XTERM.JS
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!termContainerRef.current) return;

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      theme: THEMES.emerald.xterm,
      scrollback: 5000,
      convertEol: true,
      smoothScrollDuration: 0,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);
    fitAddon.fit();

    // Lane 1: Stream keystrokes from xterm.js directly to PTY stdin
    term.onData(data => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      }
    });

    // Lane 2: Handle terminal resize events (out-of-band JSON control message)
    term.onResize(({ cols, rows }) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const onResize = () => {
      window.requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
    };

    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(termContainerRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      term.dispose();
    };
  }, []);

  // Sync theme
  useEffect(() => {
    if (termRef.current && themeConfig) {
      termRef.current.options.theme = themeConfig.xterm;
    }
  }, [themeConfig]);

  // Sync font size
  useEffect(() => {
    if (termRef.current && fitAddonRef.current) {
      termRef.current.options.fontSize = fontSize;
      window.requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
    }
  }, [fontSize]);

  // Re-fit on session change
  useEffect(() => {
    if (session) {
      window.requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
    }
  }, [session]);

  // --------------------------------------------------------------------------
  // TTL COUNTDOWN TICKER
  // --------------------------------------------------------------------------
  const sessionStatus = session?.status;
  useEffect(() => {
    if (sessionStatus !== "running" && sessionStatus !== "expiring") return;

    const timer = setInterval(() => {
      setSession(s => {
        if (!s) return null;
        const nextRemaining = s.remaining - 1;

        if (nextRemaining <= 0) {
          manualCloseRef.current = true;
          wsRef.current?.close(1000, "TTL Expired");
          termRef.current?.writeln("\r\n\x1b[38;2;255;71;87m[session expired — sandbox destroyed]\x1b[0m\r\n");
          return { ...s, remaining: 0, status: "expired" };
        }

        const nextStatus = nextRemaining <= 60 ? "expiring" : "running";
        return { ...s, remaining: nextRemaining, status: nextStatus };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStatus]);

  // --------------------------------------------------------------------------
  // TWO-LANE WEBSOCKET PTY STREAM ATTACHMENT
  // --------------------------------------------------------------------------
  const attachWebSocket = useCallback((sessionId, totalTime) => {
    manualCloseRef.current = false;

    let wsUrl = `${wsBaseUrl}/sessions/${sessionId}/attach`;
    wsUrl = wsUrl.replace(/([^:]\/)\/+/g, "$1");

    let isConnected = false;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectTimeout = setTimeout(() => {
      if (!isConnected && ws.readyState !== WebSocket.OPEN) {
        ws.close();
        termRef.current?.writeln("\r\n\x1b[31m[WebSocket connection timed out — backend unreachable]\x1b[0m");
        showToast("Connection Timeout", "WebSocket handshake timed out", "error");
        setSession(s => (s ? { ...s, status: "expired" } : null));
      }
    }, 10000);

    ws.onopen = () => {
      isConnected = true;
      clearTimeout(connectTimeout);
      setSession({
        id: sessionId,
        status: totalTime <= 60 ? "expiring" : "running",
        remaining: totalTime,
        totalTTL: totalTime,
      });

      // Send initial terminal dimensions (Lane 2 Control Message)
      if (termRef.current) {
        ws.send(
          JSON.stringify({
            type: "resize",
            cols: termRef.current.cols,
            rows: termRef.current.rows,
          })
        );
      }

      showToast("Sandbox Attached", `Session #${sessionId.slice(0, 8)} connected`, "success");
      window.requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        termRef.current?.focus();
      });
    };

    // Lane 1: Stream PTY Output from container directly to xterm.js
    ws.onmessage = event => {
      termRef.current?.write(event.data);
    };

    ws.onclose = event => {
      clearTimeout(connectTimeout);
      if (manualCloseRef.current) return;

      let reasonText = "Session disconnected (Sandbox destroyed)";
      if (event.code === 1006) {
        reasonText = "Abnormal disconnection (Server dropped stream)";
      } else if (event.reason) {
        reasonText = `Disconnected: ${event.reason}`;
      }

      termRef.current?.writeln(`\r\n\x1b[31m[Session terminated — ${reasonText}]\x1b[0m\r\n`);
      showToast("Session Disconnected", reasonText, "error");
      setSession(s => (s ? { ...s, status: "expired" } : null));
    };

    ws.onerror = () => {
      clearTimeout(connectTimeout);
      termRef.current?.writeln("\r\n\x1b[31m[WebSocket stream error encountered]\x1b[0m");
      showToast("WebSocket Error", "An error occurred with the socket stream", "error");
    };
  }, [wsBaseUrl, showToast]);

  // --------------------------------------------------------------------------
  // CREATE SESSION FLOW (Exact Cloudflare Turnstile Data)
  // --------------------------------------------------------------------------
  const startSession = useCallback(async () => {
    if (connecting || rateLimitCountdown > 0) return;
    setConnecting(true);
    setShowDiagnostics(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      // Send exact Cloudflare Turnstile token in request body
      let res = await fetch(`${apiBaseUrl}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Preserves __dp_dev signed cookie
        body: JSON.stringify({
          "cf-turnstile-response": turnstileToken,
        }),
        signal: controller.signal,
      }).catch(err => {
        throw new Error(
          err.name === "AbortError"
            ? "Backend request timed out (12s)"
            : `Cannot reach ${apiBaseUrl}. Is the Docpine backend running?`
        );
      });

      clearTimeout(timeoutId);


      // Handle 429 Too Many Requests (Per-client rate limit exceeded)
      if (res.status === 429) {
        const retryHeader = res.headers.get("Retry-After");
        let retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 15;

        try {
          const errData = await res.json();
          if (errData.retry_after && typeof errData.retry_after === "number") {
            retrySeconds = errData.retry_after;
          }
        } catch {
          // Ignore JSON parse errors on error responses
        }

        if (isNaN(retrySeconds) || retrySeconds <= 0) retrySeconds = 15;
        setRateLimitCountdown(retrySeconds);
        showToast("Rate Limit Exceeded", `Please wait ${retrySeconds}s before creating a sandbox.`, "error", 5000);
        return;
      }

      // Handle 503 Service Unavailable (Global 20-container capacity reached)
      if (res.status === 503) {
        const retryHeader = res.headers.get("Retry-After");
        let retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 30;

        try {
          const errData = await res.json();
          if (errData.retry_after && typeof errData.retry_after === "number") {
            retrySeconds = errData.retry_after;
          }
        } catch {
          // Ignore JSON parse errors
        }

        if (isNaN(retrySeconds) || retrySeconds <= 0) retrySeconds = 30;
        setCapacityCountdown(retrySeconds);
        showToast(
          "Host At Maximum Capacity",
          "All 20/20 sandboxes are active. Please wait a moment.",
          "error",
          6000
        );
        return;
      }

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData.error || errData.message) {
            errDetail = errData.message || errData.error;
          }
        } catch {
          // Non-JSON error body
        }
        throw new Error(errDetail);
      }

      // Success Response (HTTP 201 Created or HTTP 200)
      const data = await res.json();
      const sessionId = data.session_id || data.container_id;
      const ttl = data.expires_in_sec || data.expires_in || DEFAULT_TTL;

      if (!sessionId) {
        throw new Error("Invalid response from server: session_id is missing");
      }

      // Reset Turnstile tokens for fresh next session
      turnstileRef.current?.reset();
      turnstileOverlayRef.current?.reset();
      setTurnstileToken("");

      termRef.current?.clear();
      termRef.current?.reset();
      attachWebSocket(sessionId, ttl);
    } catch (err) {
      const errMsg = err.message || "Failed to create sandbox session";
      console.warn("Docpine session creation failed:", errMsg);
      setDiagnosticError(errMsg);
      setShowDiagnostics(true);
      showToast("Launch Failed", errMsg, "error");
    } finally {
      setConnecting(false);
    }
  }, [connecting, rateLimitCountdown, apiBaseUrl, attachWebSocket, showToast, turnstileToken]);



  // --------------------------------------------------------------------------
  // KILL / TERMINATE SESSION
  // --------------------------------------------------------------------------
  const killSession = useCallback(() => {
    manualCloseRef.current = true;
    if (wsRef.current) {
      wsRef.current.close(1000, "User Terminated");
      wsRef.current = null;
    }
    termRef.current?.writeln("\r\n\x1b[38;2;255;71;87m[session terminated by user]\x1b[0m\r\n");
    setSession(s => (s ? { ...s, status: "expired" } : null));
    showToast("Session Terminated", "Sandbox process destroyed", "info");
  }, [showToast]);

  // --------------------------------------------------------------------------
  // RECONNECT / RESTART SESSION
  // --------------------------------------------------------------------------
  const reconnectSession = useCallback(() => {
    startSession();
  }, [startSession]);

  // --------------------------------------------------------------------------
  // QUICK ACTIONS & TERMINAL UTILITIES
  // --------------------------------------------------------------------------
  const sendCommand = useCallback(cmd => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd + "\n");
    } else {
      showToast("Terminal Inactive", "Start a sandbox session to run commands", "error");
    }
  }, [showToast]);

  const copySessionId = useCallback(() => {
    if (!session?.id) return;
    navigator.clipboard.writeText(session.id);
    showToast("Copied to Clipboard", session.id, "success");
  }, [session, showToast]);

  const copyAllTerminal = useCallback(() => {
    if (!termRef.current) return;
    termRef.current.selectAll();
    const selection = termRef.current.getSelection();
    termRef.current.clearSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
      showToast("Terminal Copied", "Entire terminal buffer copied to clipboard", "success");
    } else {
      showToast("Empty Buffer", "No terminal content to copy", "info");
    }
  }, [showToast]);

  const downloadLog = useCallback(() => {
    if (!termRef.current) return;
    termRef.current.selectAll();
    const content = termRef.current.getSelection() || "Docpine session log";
    termRef.current.clearSelection();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docpine-${session?.id || "session"}.log`;
    a.click();
    URL.revokeObjectURL(a);
    showToast("Log Exported", "Session log downloaded successfully", "success");
  }, [session?.id, showToast]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      fitAddonRef.current?.fit();
    }, 200);
  }, []);

  // --------------------------------------------------------------------------
  // RADIAL TTL GAUGE CALCULATIONS
  // --------------------------------------------------------------------------
  const gaugePercent = useMemo(() => {
    if (!session || !session.totalTTL) return 100;
    return Math.max(0, Math.min(100, (session.remaining / session.totalTTL) * 100));
  }, [session]);

  const gaugeRadius = 8;
  const circumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffset = circumference - (gaugePercent / 100) * circumference;

  const ttlColor = useMemo(() => {
    if (!session) return "#64748b";
    if (session.remaining <= 30) return "#ff4757";
    if (session.remaining <= 60) return "#ffa502";
    return themeConfig.primary;
  }, [session, themeConfig.primary]);

  return (
    <ErrorBoundary>
      <div
        ref={appContainerRef}
        className="workspace"
        style={{
          "--theme-primary": themeConfig.primary,
          "--theme-glow": themeConfig.primaryGlow,
          "--theme-surface": themeConfig.surface,
          "--theme-surface-alt": themeConfig.surfaceAlt,
          "--theme-border": themeConfig.border,
        }}
      >
        <div className="ambient-canvas">
          <div className="ambient-glow-1" />
          <div className="ambient-glow-2" />
          <div className="grid-overlay" />
        </div>

        {!isOnline && (
          <div className="offline-banner">
            <span>⚠️ Network offline. Check internet connection.</span>
          </div>
        )}

        {rateLimitCountdown > 0 && (
          <div className="rate-limit-banner">
            <span className="banner-icon">⏳</span>
            <span>Rate limit active: retry in <strong>{rateLimitCountdown}s</strong></span>
          </div>
        )}

        {capacityCountdown > 0 && (
          <div className="capacity-limit-banner">
            <span className="banner-icon">⚠️</span>
            <span>Host at full capacity (20/20 active sandboxes). Wait <strong>{capacityCountdown}s</strong></span>
          </div>
        )}

        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast-card ${t.type}`}>
              <div className="toast-body">
                <div className="toast-title">{t.title}</div>
                <div className="toast-msg">{t.msg}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={`terminal-window ${isFullscreen ? "fullscreen" : ""}`}>
          <div className="window-header">
            <div className="header-left">
              <div className="traffic-lights">
                <button
                  className="traffic-dot close"
                  title="Terminate Session"
                  onClick={session ? killSession : () => setSession(null)}
                />
                <button
                  className="traffic-dot min"
                  title="Toggle Quick Bar"
                  onClick={() => setFontSize(s => (s === 13 ? 12 : 13))}
                />
                <button
                  className="traffic-dot max"
                  title="Toggle Fullscreen"
                  onClick={toggleFullscreen}
                />
              </div>

              <div className="brand-group">
                <span className="brand-logo">
                  <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L4 12h5v8h6v-8h5L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  docpine
                </span>
                <span className="badge-pill">sandbox</span>
              </div>
            </div>

            <div className="header-center">
              {session && (
                <div className="container-chip" onClick={copySessionId} title="Click to copy Session ID">
                  <span>#{session.id.slice(0, 10)}</span>
                  <span className="copy-hint">📋</span>
                </div>
              )}
            </div>

            <div className="header-right">
              {session && (session.status === "running" || session.status === "expiring") && (
                <div className="ttl-gauge-wrap" title="Sandbox Lifetime (TTL)">
                  <svg className="gauge-svg" width="20" height="20">
                    <circle
                      className="gauge-track"
                      cx="10"
                      cy="10"
                      r={gaugeRadius}
                      strokeWidth="2.5"
                    />
                    <circle
                      className="gauge-progress"
                      cx="10"
                      cy="10"
                      r={gaugeRadius}
                      strokeWidth="2.5"
                      stroke={ttlColor}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <span className="ttl-text" style={{ color: ttlColor }}>
                    {fmtTTL(session.remaining)}
                  </span>
                </div>
              )}

              {session && (session.status === "running" || session.status === "expiring") && (
                <button className="action-btn kill" onClick={killSession} title="Kill session and delete sandbox">
                  kill
                </button>
              )}

              {session && session.status === "expired" && (
                <button
                  className="action-btn reconnect"
                  onClick={reconnectSession}
                  disabled={connecting || rateLimitCountdown > 0}
                >
                  {connecting ? "reconnecting..." : "restart"}
                </button>
              )}

              <button
                className="icon-btn"
                title="Change Theme"
                onClick={() => {
                  const themeKeys = Object.keys(THEMES);
                  const nextIdx = (themeKeys.indexOf(currentTheme) + 1) % themeKeys.length;
                  setCurrentTheme(themeKeys[nextIdx]);
                  showToast("Theme Changed", THEMES[themeKeys[nextIdx]].name, "info", 1500);
                }}
              >
                🎨
              </button>
            </div>
          </div>

          {session && (
            <div className="quick-bar">
              <span className="quick-label">Quick Actions:</span>
              <div className="command-pills">
                <button className="cmd-pill" onClick={() => sendCommand("clear")}>clear</button>
                <button className="cmd-pill" onClick={() => sendCommand("ls -la")}>ls -la</button>
                <button className="cmd-pill" onClick={() => sendCommand("uname -a")}>uname -a</button>
                <button className="cmd-pill" onClick={() => sendCommand("whoami")}>whoami</button>
                <button className="cmd-pill" onClick={() => sendCommand("date")}>date</button>
              </div>

              <div className="quick-tools">
                <button className="tool-btn" onClick={() => setFontSize(s => Math.max(10, s - 1))} title="Decrease font">A-</button>
                <button className="tool-btn" onClick={() => setFontSize(s => Math.min(20, s + 1))} title="Increase font">A+</button>
                <button className="tool-btn" onClick={copyAllTerminal} title="Copy all terminal output">Copy All</button>
                <button className="tool-btn" onClick={downloadLog} title="Download session log">Log</button>
              </div>
            </div>
          )}

          <div
            className="terminal-body"
            ref={termContainerRef}
            style={{ display: session ? "block" : "none" }}
          >
            {session && session.status === "expired" && (
              <div className="session-overlay">
                <div className="overlay-card">
                  <div className="overlay-icon-wrap expired">
                    ⏳
                  </div>
                  <h3 className="overlay-title">Sandbox Expired</h3>
                  <p className="overlay-desc">
                    The ephemeral sandbox lifetime completed or was closed. All temporary container files and processes were safely destroyed.
                  </p>

                  <div className="turnstile-wrapper overlay-mode">
                    <TurnstileWidget
                      ref={turnstileOverlayRef}
                      theme="dark"
                      onSuccess={token => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken("")}
                      onError={err => console.warn("Turnstile verification error:", err)}
                    />
                  </div>

                  <button
                    className="launch-btn"
                    onClick={reconnectSession}
                    disabled={connecting || rateLimitCountdown > 0}
                  >
                    {connecting ? (
                      <>
                        <span className="spinner" />
                        <span>Initializing Sandbox...</span>
                      </>
                    ) : rateLimitCountdown > 0 ? (
                      <span>Wait {rateLimitCountdown}s (Rate Limited)</span>
                    ) : (
                      <span>Start New Sandbox Session</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!session && (
            <div className="launcher-view">
              <div className="launcher-emblem">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--theme-primary, #00f5a0)" strokeWidth="2">
                  <path d="M12 2L4 12h5v8h6v-8h5L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h1 className="launcher-title">Ephemeral Sandbox Terminal</h1>
              <p className="launcher-subtitle">
                Ultra-fast isolated sandbox container shell with real-time Two-Lane WebSocket PTY streaming and automated abuse protection.
              </p>

              <div className="turnstile-wrapper">
                <TurnstileWidget
                  ref={turnstileRef}
                  theme="dark"
                  onSuccess={token => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  onError={err => console.warn("Turnstile verification error:", err)}
                />
              </div>

              <button
                className="launch-btn"
                onClick={startSession}
                disabled={connecting || rateLimitCountdown > 0}
              >
                {connecting ? (
                  <>
                    <span className="spinner" />
                    <span>Provisioning Sandbox...</span>
                  </>
                ) : rateLimitCountdown > 0 ? (
                  <>
                    <span>⏳ Rate Limited (Retry in {rateLimitCountdown}s)</span>
                  </>
                ) : capacityCountdown > 0 ? (
                  <>
                    <span>⚠️ Host Full (Retry in {capacityCountdown}s)</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Start Sandbox Session</span>
                  </>
                )}
              </button>


              <div className="shortcut-hints">
                <span><span className="kbd">Ctrl</span> + <span className="kbd">L</span> Clear</span>
                <span><span className="kbd">Ctrl</span> + <span className="kbd">C</span> SIGINT</span>
                <span><span className="kbd">Ctrl</span> + <span className="kbd">D</span> EOF</span>
              </div>
            </div>
          )}

          <div className="terminal-status-bar">
            <div className="status-left">
              <div className="status-item">
                <span
                  className={`pulse-dot ${
                    session?.status === "running"
                      ? "online"
                      : session?.status === "expiring"
                      ? "warning"
                      : ""
                  }`}
                />
                <span>
                  {session?.status === "running"
                    ? "Live Two-Lane PTY Connected"
                    : session?.status === "expiring"
                    ? "Session Expiring"
                    : rateLimitCountdown > 0
                    ? `Rate Limited (${rateLimitCountdown}s)`
                    : capacityCountdown > 0
                    ? `Host Full (${capacityCountdown}s)`
                    : "Docpine Ephemeral Sandbox"}
                </span>


              </div>
              <div className="status-item">
                <span>Theme: {themeConfig.name}</span>
              </div>
            </div>

            <div className="status-right">
              <div className="status-item">
                <span>UTF-8</span>
              </div>
              <div className="status-item">
                <span>xterm-256color</span>
              </div>
            </div>
          </div>
        </div>

        {showDiagnostics && (
          <div className="modal-backdrop" onClick={() => setShowDiagnostics(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "#ff4757", display: "flex", alignItems: "center", gap: 8 }}>
                  🔌 Backend Connection Notice
                </h3>
                <button className="icon-btn" onClick={() => setShowDiagnostics(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p className="overlay-desc">
                  Docpine UI was unable to create a sandbox session on <code style={{ color: "#00f5a0" }}>{apiBaseUrl}</code>.
                </p>
                <div className="diagnostic-box">
                  {diagnosticError || "Connection refused (ERR_CONNECTION_REFUSED)"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#94a3b8" }}>
                  <div>💡 <strong>Troubleshooting Steps:</strong></div>
                  <div>1. Ensure the Docpine backend service is running on <code>{apiBaseUrl}</code>.</div>
                  <div>2. Verify CORS allows origin and <code>credentials: include</code> headers.</div>
                  <div>3. Check if rate limits (429) or host capacity limits (503) are active.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="launch-btn"
                  style={{ padding: "8px 20px", fontSize: 12 }}
                  onClick={() => {
                    setShowDiagnostics(false);
                    startSession();
                  }}
                  disabled={rateLimitCountdown > 0}
                >
                  🔄 Retry Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default DocpineTerminal;
