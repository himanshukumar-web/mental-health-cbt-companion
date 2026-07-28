"use client";

interface ActionPlan {
  id?: string;
  breathing_exercise?: string;
  walking_goal?: string;
  hydration_goal?: string;
  meditation_rec?: string;
  journal_prompt?: string;
  sleep_rec?: string;
  motivational_msg?: string;
}

export default function ActionPlanCard({ plan }: { plan: ActionPlan }) {
  if (!plan) return null;

  const items = [
    { icon: "🫁", title: "Breathing Exercise", text: plan.breathing_exercise, color: "#3b82f6" },
    { icon: "🚶", title: "Walking Goal", text: plan.walking_goal, color: "#22c55e" },
    { icon: "💧", title: "Hydration", text: plan.hydration_goal, color: "#06b6d4" },
    { icon: "🧘", title: "Meditation", text: plan.meditation_rec, color: "#8b5cf6" },
    { icon: "📝", title: "Journal Prompt", text: plan.journal_prompt, color: "#f59e0b" },
    { icon: "🌙", title: "Sleep Hygiene", text: plan.sleep_rec, color: "#6366f1" },
  ].filter(i => !!i.text);

  return (
    <div
      style={{
        padding: "24px",
        borderRadius: 20,
        background: "var(--bg-glass)",
        border: "1px solid rgba(34,197,94,0.3)",
        backdropFilter: "blur(12px)",
        marginTop: 20,
        marginBottom: 20,
        animation: "slideUp 0.4s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          📋
        </div>
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            Your Personalized Wellness Action Plan
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            Generated based on your conversation with Sera
          </p>
        </div>
      </div>

      {plan.motivational_msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(34,197,94,0.08)",
            border: "0.5px solid rgba(34,197,94,0.2)",
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.6,
            marginBottom: 20,
            fontStyle: "italic",
          }}
        >
          &quot;{plan.motivational_msg}&quot;
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: "14px",
              borderRadius: 12,
              background: "var(--bg-secondary)",
              border: "0.5px solid var(--border-secondary)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: item.color,
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{item.icon}</span> {item.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {item.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
