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
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 12, width: "100%" }}>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
              Select AI Therapist Persona
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "2px 0 0" }}>
              Switch personas anytime to change conversation style and therapy focus.
            </p>
          </div>
        </div>
      )}

      {/* Horizontal Scroll Row of Avatar Cards */}
      <div
        className="quick-prompts-scroll custom-scrollbar"
        style={{
          display: "flex",
          gap: compact ? 8 : 12,
          overflowX: "auto",
          paddingBottom: 4,
          scrollSnapType: "x mandatory",
        }}
      >
        {personas.map((persona) => {
          const isSelected = persona.id === activePersonaId;
          return (
            <motion.button
              key={persona.id}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectPersona(persona.id)}
              style={{
                flex: compact ? "0 0 160px" : "0 0 230px",
                scrollSnapAlign: "start",
                display: "flex",
                alignItems: "center",
                gap: compact ? 10 : 12,
                padding: compact ? "8px 12px" : "12px 14px",
                borderRadius: 16,
                border: isSelected ? `2px solid ${persona.color}` : "1px solid var(--border-secondary)",
                background: isSelected
                  ? `linear-gradient(135deg, ${persona.color}20, ${persona.color}05)`
                  : "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isSelected ? `0 6px 20px ${persona.color}30` : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Active Indicator Bar */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 4,
                    background: persona.color,
                    boxShadow: `0 0 10px ${persona.color}`,
                  }}
                />
              )}

              {/* Avatar Icon with Glow Ring */}
              <div
                style={{
                  width: compact ? 36 : 44,
                  height: compact ? 36 : 44,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${persona.color}40, ${persona.color}90)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: compact ? 18 : 22,
                  flexShrink: 0,
                  boxShadow: isSelected ? `0 0 16px ${persona.color}60` : `0 0 8px ${persona.color}20`,
                  border: `2px solid ${persona.color}`,
                }}
              >
                {persona.avatar}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                  <span
                    style={{
                      fontSize: compact ? 12 : 14,
                      fontWeight: 800,
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
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 6,
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
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 1,
                  }}
                >
                  {persona.title}
                </div>

                {!compact && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      marginTop: 3,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
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
