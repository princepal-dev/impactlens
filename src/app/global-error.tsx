"use client";

import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0a",
          color: "#f5f5f4",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.12em", color: "#2dd4bf" }}>IMPACTLENS</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: "16px 0 8px" }}>Something went wrong</h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#a1a1aa", margin: 0 }}>
            The application hit an unexpected error. Your evidence is safe.
            {error.digest ? ` Reference: ${error.digest}` : ""}
          </p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 20,
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid rgba(45,212,191,0.4)",
              background: "rgba(45,212,191,0.12)",
              color: "#f5f5f4",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
