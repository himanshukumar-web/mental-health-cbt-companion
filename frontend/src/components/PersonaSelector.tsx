"use client";

import { Persona } from "@/types/persona";
import { motion } from "framer-motion";

interface PersonaSelectorProps {
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (personaId: string) => void;
  compact?: boolean;
}

export default function PersonaSelector({
  personas,
  activePersonaId,
  onSelectPersona,
  compact = false,
}: PersonaSelectorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 14, width: "100%" }}>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              AI Therapist Persona
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
              Switch personas anytime. Each persona brings a unique response style and emotional focus.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(auto-fill, minmax(130px, 1fr))" : "repeat(auto-fill, minmax(220px, 1fr))",
          gap: compact ? 8 : 12,
        }}
      >
        {personas.map((persona) => {
          const isSelected = persona.id === activePersonaId;
          return (
            <motion.button
              key={persona.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPersona(persona.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: compact ? 8 : 12,
                padding: compact ? "8px 10px" : "12px 14px",
                borderRadius: 14,
                border: isSelected ? `2px solid ${persona.color}` : "1px solid var(--border-secondary)",
                background: isSelected ? `${persona.color}15` : "var(--bg-glass)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isSelected ? `0 4px 20px ${persona.color}30` : "none",
              }}
            >
              <div
                style={{
                  width: compact ? 32 : 42,
                  height: compact ? 32 : 42,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${persona.color}40, ${persona.color}90)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: compact ? 16 : 22,
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${persona.color}40`,
                }}
              >
                {persona.avatar}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: compact ? 12 : 14,
                      fontWeight: 700,
                      color: isSelected ? persona.color : "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {persona.name}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 8,
                        background: persona.color,
                        color: "#fff",
                        textTransform: "uppercase",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: compact ? 10 : 11,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {persona.title}
                </div>
                {!compact && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      marginTop: 4,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {persona.description}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
