"use client";

import { useState, useCallback, useEffect } from "react";
import { PHQ9Assessment, GAD7Assessment } from "@/types/persona";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export function useAssessments(userId?: string) {
  const [phq9History, setPhq9History] = useState<PHQ9Assessment[]>([]);
  const [gad7History, setGad7History] = useState<GAD7Assessment[]>([]);
  const [phq9Comparison, setPhq9Comparison] = useState<any>(null);
  const [gad7Comparison, setGad7Comparison] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [phqRes, gadRes, phqCompRes, gadCompRes] = await Promise.all([
        fetch(`${API_URL}/assessments/phq9/${userId}`),
        fetch(`${API_URL}/assessments/gad7/${userId}`),
        fetch(`${API_URL}/assessments/phq9/${userId}/compare`),
        fetch(`${API_URL}/assessments/gad7/${userId}/compare`),
      ]);

      if (phqRes.ok) {
        const data = await phqRes.json();
        setPhq9History(data.history || []);
      }
      if (gadRes.ok) {
        const data = await gadRes.json();
        setGad7History(data.history || []);
      }
      if (phqCompRes.ok) {
        setPhq9Comparison(await phqCompRes.json());
      }
      if (gadCompRes.ok) {
        setGad7Comparison(await gadCompRes.json());
      }
    } catch (err) {
      console.error("Error fetching assessments history:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const submitPHQ9 = async (answers: number[]) => {
    if (!userId) return null;
    try {
      const res = await fetch(`${API_URL}/assessments/phq9`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, answers }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchHistory();
        return data.assessment as PHQ9Assessment;
      }
    } catch (err) {
      console.error("Error submitting PHQ9:", err);
    }
    return null;
  };

  const submitGAD7 = async (answers: number[]) => {
    if (!userId) return null;
    try {
      const res = await fetch(`${API_URL}/assessments/gad7`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, answers }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchHistory();
        return data.assessment as GAD7Assessment;
      }
    } catch (err) {
      console.error("Error submitting GAD7:", err);
    }
    return null;
  };

  return {
    phq9History,
    gad7History,
    phq9Comparison,
    gad7Comparison,
    submitPHQ9,
    submitGAD7,
    refetch: fetchHistory,
    loading,
  };
}
