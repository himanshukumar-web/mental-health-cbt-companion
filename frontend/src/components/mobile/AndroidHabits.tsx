"use client";

import React, { useState } from "react";
import AndroidMobileLayout from "./AndroidMobileLayout";
import { MD3TopAppBar } from "./ui/TopAppBar";
import { MD3Card } from "./ui/Card";
import { MD3Button } from "./ui/Button";
import { MD3Input } from "./ui/Input";
import { MD3BottomSheet } from "./ui/BottomSheet";
import toast from "react-hot-toast";

interface Habit {
  id: string;
  title: string;
  icon: string;
  streak: number;
  completed: boolean;
}

const DEFAULT_HABITS: Habit[] = [
  { id: "1", title: "10-Minute Morning Meditation", icon: "🧘", streak: 5, completed: true },
  { id: "2", title: "Log Mood Check-in", icon: "🎭", streak: 3, completed: false },
  { id: "3", title: "Guided CBT Breathing", icon: "🫁", streak: 7, completed: true },
  { id: "4", title: "Drink 2L Water", icon: "💧", streak: 12, completed: false },
  { id: "5", title: "Gratitude Journaling", icon: "📝", streak: 2, completed: false },
];

export default function AndroidHabits() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [showAddSheet, setShowAddSheet] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newIcon, setNewIcon] = useState<string>("✨");

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.completed;
          if (nextCompleted) toast.success(`Completed: ${h.title}! 🎉`);
          return {
            ...h,
            completed: nextCompleted,
            streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      })
    );
  };

  const handleAddHabit = () => {
    if (!newTitle.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      icon: newIcon || "✨",
      streak: 0,
      completed: false,
    };
    setHabits((prev) => [newHabit, ...prev]);
    setNewTitle("");
    setShowAddSheet(false);
    toast.success("Habit created!");
  };

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <AndroidMobileLayout>
      <MD3TopAppBar
        title="Mindful Habits"
        subtitle="Daily wellness routines"
        actions={
          <MD3Button variant="tonal" onClick={() => setShowAddSheet(true)} style={{ height: "36px", padding: "0 12px" }}>
            + Habit
          </MD3Button>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Daily Summary Card */}
        <MD3Card variant="elevated" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700 }}>TODAY'S PROGRESS</span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#e8edf5", marginTop: "4px" }}>
                {completedCount} / {habits.length} <span style={{ fontSize: "14px", color: "#8b95a7" }}>Done</span>
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.15)",
                border: "3px solid #22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 800,
                color: "#4ade80",
              }}
            >
              {Math.round((completedCount / (habits.length || 1)) * 100)}%
            </div>
          </div>
        </MD3Card>

        {/* Habit List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {habits.map((habit) => (
            <MD3Card
              key={habit.id}
              clickable
              variant="filled"
              onClick={() => toggleHabit(habit.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: habit.completed ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 255, 255, 0.08)",
                background: habit.completed ? "rgba(34, 197, 94, 0.08)" : "rgba(255, 255, 255, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* Custom Checkbox */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "8px",
                    border: habit.completed ? "none" : "2px solid rgba(255, 255, 255, 0.3)",
                    background: habit.completed ? "#22c55e" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {habit.completed && "✓"}
                </div>

                <div style={{ fontSize: "24px" }}>{habit.icon}</div>

                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: habit.completed ? "#8b95a7" : "#e8edf5",
                      textDecoration: habit.completed ? "line-through" : "none",
                    }}
                  >
                    {habit.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#f59e0b", marginTop: "2px" }}>
                    🔥 {habit.streak} day streak
                  </div>
                </div>
              </div>
            </MD3Card>
          ))}
        </div>
      </div>

      {/* Add Habit Sheet */}
      <MD3BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Create New Habit">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <MD3Input
            label="Habit Name"
            type="text"
            placeholder="e.g. 15-Minute Evening Walk"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <MD3Input
            label="Emoji Icon"
            type="text"
            placeholder="🚶"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
          />
          <MD3Button fullWidth onClick={handleAddHabit}>
            Add Habit
          </MD3Button>
        </div>
      </MD3BottomSheet>
    </AndroidMobileLayout>
  );
}
