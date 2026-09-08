"use client";

// ルートレイアウト自体でエラーが出たときの最終防衛線。
// global-error は独自の <html><body> を描く必要がある（通常の error.tsx と違う）。
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
          color: "#000",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#767676" }}>
          Something went wrong
        </p>
        <p style={{ marginTop: "16px", fontSize: "14px", color: "#767676" }}>
          ページを読み込めませんでした。
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "32px",
            border: "1px solid #000",
            background: "transparent",
            padding: "12px 24px",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
