"use client";

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function LoadingSkeleton({ width = "100%", height = 20, borderRadius = 8, style }: LoadingSkeletonProps) {
  return (
    <div
      style={{
        width, height, borderRadius,
        background: "linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(255,255,255,0.05) 50%, var(--bg-tertiary) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div style={{
      padding: "20px", borderRadius: 16,
      background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
    }}>
      <LoadingSkeleton height={14} width="60%" style={{ marginBottom: 12 }} />
      <LoadingSkeleton height={32} width="40%" style={{ marginBottom: 16 }} />
      <LoadingSkeleton height={12} width="80%" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          padding: "16px 20px", borderRadius: 14,
          background: "var(--bg-glass)", border: "0.5px solid var(--border-secondary)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <LoadingSkeleton width={40} height={40} borderRadius={12} />
          <div style={{ flex: 1 }}>
            <LoadingSkeleton height={14} width="50%" style={{ marginBottom: 8 }} />
            <LoadingSkeleton height={11} width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ padding: "24px 20px" }}>
      <LoadingSkeleton height={28} width="40%" style={{ marginBottom: 8 }} />
      <LoadingSkeleton height={14} width="60%" style={{ marginBottom: 32 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}
