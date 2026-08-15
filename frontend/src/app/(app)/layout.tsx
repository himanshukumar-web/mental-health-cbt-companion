"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyReminders } from "@/hooks/useDailyReminders";
import MobileBottomNav from "@/components/MobileBottomNav";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Automatically check & generate daily reminders for pending tasks
  useDailyReminders();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {children}
      <MobileBottomNav />
    </>
  );
}
