"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import {
  Play,
  CheckCircle2,
  ChevronDown,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toCourse } from "@/lib/transformers";
import type { Course } from "@/lib/types";

export default function CursosDesktopPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: Record<string, unknown>) => toCourse(c));
        setCourses(mapped);
        // Expand first course by default
        if (mapped.length > 0) setExpandedId(mapped[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function handleWatchLesson(
    courseId: string,
    lessonId: string,
    link: string
  ) {
    window.open(link, "_blank", "noopener,noreferrer");
    setCompleting(lessonId);
    try {
      await fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      await fetchCourses();
    } finally {
      setCompleting(null);
    }
  }

  function toggleExpand(courseId: string) {
    setExpandedId((prev) => (prev === courseId ? null : courseId));
  }

  if (loading) {
    return (
      <div className="desktop-container py-10 max-w-4xl mx-auto">
        <div className="h-24 bg-surface rounded-2xl animate-pulse mb-8" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-surface rounded-2xl animate-pulse mb-4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="desktop-container py-8 pb-16 max-w-4xl mx-auto">
      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10"
      >
        <h1 className="text-[32px] font-bold text-text-primary tracking-tight">
          Meus Cursos
        </h1>
        <p className="text-[15px] text-text-secondary mt-1">
          Conteúdo exclusivo da Comunidade Crown
        </p>
      </motion.div>

      {/* ── Course Accordion List ── */}
      <AnimatedList className="space-y-5">
        {courses.length === 0 && (
          <AnimatedItem>
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-900/8 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-brand-900/40" />
              </div>
              <p className="text-[15px] text-text-secondary font-medium">
                Nenhum curso disponível.
              </p>
            </div>
          </AnimatedItem>
        )}

        {courses.map((course) => {
          const isExpanded = expandedId === course.id;
          const progress =
            course.lessonCount > 0
              ? (course.completedLessons / course.lessonCount) * 100
              : 0;
          const isComplete = progress === 100;
          const statusLabel = isComplete
            ? "Completo"
            : course.completedLessons > 0
              ? "Em progresso"
              : "Não iniciado";
          const ctaLabel =
            course.completedLessons > 0 ? "Continuar" : "Começar";

          return (
            <AnimatedItem key={course.id}>
              {/* Section Divider */}
              <div className="mb-4">
                <div className="flex items-center gap-4 justify-center">
                  <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent to-brand-900/30 rounded-full" />
                  <h2 className="text-[12px] font-bold text-brand-900 uppercase tracking-[0.2em] whitespace-nowrap">
                    {course.name}
                  </h2>
                  <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent to-brand-900/30 rounded-full" />
                </div>
              </div>

              <Card className="overflow-hidden p-0">
                {/* Course Header — clickable to expand */}
                <button
                  onClick={() => toggleExpand(course.id)}
                  className="w-full text-left"
                >
                  <div className="p-5 flex items-start gap-4">
                    {/* Play icon */}
                    <div className="w-12 h-12 rounded-xl bg-brand-900 flex items-center justify-center shrink-0 mt-0.5">
                      {course.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.imageUrl}
                          alt={course.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Play
                          size={20}
                          className="text-white ml-0.5"
                          fill="white"
                        />
                      )}
                    </div>

                    {/* Title + description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-bold text-text-primary leading-snug">
                        {course.name}
                      </h3>
                      <p className="text-[13px] text-text-secondary mt-0.5 line-clamp-1">
                        {course.description}
                      </p>
                    </div>

                    {/* Status + chevron */}
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span
                        className={`text-[12px] font-medium ${
                          isComplete
                            ? "text-success-500"
                            : "text-text-secondary"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown
                          size={18}
                          className="text-text-secondary"
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 pb-1">
                    <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? "bg-success-500" : "bg-brand-900"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats + CTA row */}
                  <div className="px-5 pb-4 pt-2 flex items-center justify-between">
                    <span className="text-[12px] text-text-secondary">
                      {course.completedLessons}/{course.lessonCount} aulas ·{" "}
                      {Math.round(progress)}%
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-900 text-white text-[12px] font-semibold">
                      <Play size={12} fill="white" />
                      {ctaLabel}
                    </span>
                  </div>
                </button>

                {/* Expanded — Lesson List */}
                <AnimatePresence>
                  {isExpanded && course.lessons && course.lessons.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-muted/15 px-5 py-4">
                        {/* Module header */}
                        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.15em] mb-3">
                          Módulo 1
                        </p>

                        <div className="space-y-1">
                          {course.lessons.map((lesson, i) => (
                            <button
                              key={lesson.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWatchLesson(
                                  course.id,
                                  lesson.id,
                                  lesson.link
                                );
                              }}
                              disabled={completing === lesson.id}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group ${
                                completing === lesson.id
                                  ? "opacity-50"
                                  : "hover:bg-surface-alt"
                              }`}
                            >
                              {/* Number */}
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold border-2 ${
                                  lesson.completed
                                    ? "bg-success-500 border-success-500 text-white"
                                    : "border-brand-900/30 text-brand-900"
                                }`}
                              >
                                {lesson.completed ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  i + 1
                                )}
                              </div>

                              {/* Thumbnail placeholder */}
                              <div className="w-9 h-9 rounded-lg bg-brand-900/8 flex items-center justify-center shrink-0">
                                <Play
                                  size={14}
                                  className="text-brand-900/50 ml-0.5"
                                  fill="currentColor"
                                />
                              </div>

                              {/* Title */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-[13px] truncate ${
                                    lesson.completed
                                      ? "text-text-secondary"
                                      : "text-text-primary font-medium"
                                  }`}
                                >
                                  {lesson.title}
                                </p>
                              </div>

                              {/* Play button */}
                              <div className="shrink-0">
                                {lesson.completed ? (
                                  <ExternalLink
                                    size={16}
                                    className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center">
                                    <Play
                                      size={13}
                                      className="text-white ml-0.5"
                                      fill="white"
                                    />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </AnimatedItem>
          );
        })}
      </AnimatedList>
    </div>
  );
}
