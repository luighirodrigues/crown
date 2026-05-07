"use client";

import { useSession } from "next-auth/react";
import { FeedbackWidget } from "@/components/feedback-widget";

export function FeedbackWidgetWrapper() {
  const { status } = useSession();

  if (status !== "authenticated") {
    return null;
  }

  return <FeedbackWidget />;
}