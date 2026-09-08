"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Docpine UI ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#0a0d0f",
          color: "#f8fafc",
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          <div style={{
            maxWidth: 540,
            width: "100%",
            background: "#141c22",
            border: "1px solid #ff4757",
            borderRadius: 12,
            padding: 28,
            boxShadow: "0 20px 50px rgba(0,0,0,0.7)"
          }}>
            <h2 style={{ fontSize: 18, color: "#ff4757", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ Application Render Error
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>
              An unhandled rendering exception occurred in Docpine UI.
            </p>
            <div style={{
              background: "#090d0f",
              padding: 12,
              borderRadius: 6,
              fontSize: 11,
              color: "#fca5a5",
              maxHeight: 140,
              overflowY: "auto",
              marginBottom: 20
            }}>
              {this.state.error?.toString() || "Unknown error"}
            </div>
            <button
              onClick={this.handleReload}
              style={{
                background: "#00f5a0",
                color: "#090d0f",
                border: "none",
                borderRadius: 6,
                padding: "8px 18px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
