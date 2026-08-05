"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "var(--bg-primary)",
          padding: 24,
        }}>
          <div style={{
            maxWidth: 420, textAlign: "center",
            padding: "40px 32px", borderRadius: 20,
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-secondary)",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h2 style={{
              fontSize: 20, fontWeight: 700, color: "var(--text-primary)",
              fontFamily: "var(--font-display)", marginBottom: 8,
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7,
              marginBottom: 24,
            }}>
              Don&apos;t worry — your data is safe. Try refreshing the page.
            </p>
            {this.state.error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "0.5px solid rgba(239,68,68,0.2)",
                fontSize: 12, color: "var(--text-tertiary)",
                marginBottom: 20, textAlign: "left",
                fontFamily: "monospace", wordBreak: "break-word",
              }}>
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleRetry}
              style={{
                padding: "12px 32px", borderRadius: 12,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "none", color: "white",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
