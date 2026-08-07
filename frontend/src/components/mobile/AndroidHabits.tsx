"use client";

import React, { useState } from "react";
import AndroidMobileLayout from "./AndroidMobileLayout";
import {
  TopAppBar,
  MaterialCard,
  PrimaryButton,
  SecondaryButton,
  TextField,
  BottomSheet,
  ProgressRing,
} from "./ui";
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
  const percent = Math.round((completedCount / (habits.length || 1)) * 100);

  return (
    <AndroidMobileLayout>
      <TopAppBar
        title="Mindful Habits"
        subtitle="Daily wellness routines"
        actions={
          <SecondaryButton onClick={() => setShowAddSheet(true)} style={{ minHeight: "36px", padding: "0 12px", borderRadius: "100px" }}>
            + Habit
          </SecondaryButton>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Daily Summary Card */}
        <MaterialCard variant="elevated" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700 }}>TODAY'S PROGRESS</span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#e8edf5", marginTop: "4px" }}>
                {completedCount} / {habits.length} <span style={{ fontSize: "14px", color: "#8b95a7" }}>Done</span>
              </div>
            </div>
            <ProgressRing progress={percent} size={60} strokeWidth={5} />
          </div>
        </MaterialCard>

        {/* Habit List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {habits.map((habit) => (
            <MaterialCard
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
            </MaterialCard>
          ))}
        </div>
      </div>

      {/* Add Habit Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Create New Habit">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <TextField
            label="Habit Name"
            type="text"
            placeholder="e.g. 15-Minute Evening Walk"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextField
            label="Emoji Icon"
            type="text"
            placeholder="🚶"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
          />
          <PrimaryButton fullWidth onClick={handleAddHabit}>
            Add Habit
          </PrimaryButton>
        </div>
      </BottomSheet>
    </AndroidMobileLayout>
  );
}
