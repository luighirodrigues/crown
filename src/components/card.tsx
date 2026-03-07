"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function Card({ children, className, hover = false, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { scale: 1.01 } : undefined}
      className={cn(
        "bg-surface rounded-[var(--radius-card)] p-4",
        "shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
