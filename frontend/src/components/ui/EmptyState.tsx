"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  tip?: string;
}

export default function EmptyState({
  icon = "🌿",
  title,
  description,
  actionText,
  actionHref,
  onAction,
  tip,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: "48px 24px",
        borderRadius: 24,
        background: "var(--bg-glass)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--border-secondary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        maxWidth: 520,
        margin: "24px auto",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.04))",
          border: "1px solid rgba(34,197,94,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          marginBottom: 20,
          boxShadow: "0 8px 32px rgba(34,197,94,0.15)",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: 8,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: tip ? 16 : 24,
          maxWidth: 420,
        }}
      >
        {description}
      </p>

      {tip && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.25)",
            color: "#93c5fd",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>💡</span>
          <span>{tip}</span>
        </div>
      )}

      {actionText && actionHref && (
        <Link
          href={actionHref}
          style={{
            padding: "12px 24px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
            transition: "transform 0.2s",
          }}
        >
          {actionText} →
        </Link>
      )}

      {actionText && !actionHref && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: "12px 24px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
          }}
        >
          {actionText} →
        </button>
      )}
    </motion.div>
  );
}
