"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Signup is now handled inside /login via tab switching.
// This page simply redirects there with the signup tab pre-selected.
export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/login?mode=signup"); }, [router]);
  return null;
}
