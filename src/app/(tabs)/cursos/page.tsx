"use client";

import { useState, useEffect, useCallback } from "react";
import { useIsDesktop } from "@/lib/use-media-query";
import CursosDesktopPage from "./page-desktop";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/card";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Play, CheckCircle2, BookOpen } from "lucide-react";
import { toCourse } from "@/lib/transformers";
import type { Course } from "@/lib/types";

export default function CursosPage() {
  const isDesktop = useIsDesktop();

  if (isDesktop) return <CursosDesktopPage />;

  return <CursosMobilePage />;
}

function CursosMobilePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.map((c: Record<string, unknown>) => toCourse(c)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <>
        <AppHeader title="Meus Cursos" />
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Meus Cursos" />

      <div className="px-4 py-4">
        <AnimatedList className="space-y-4">
          {courses.length === 0 && (
            <AnimatedItem>
              <Card className="p-8 text-center">
                <p className="text-text-secondary text-sm">Nenhum curso disponível.</p>
              </Card>
            </AnimatedItem>
          )}
          {courses.map((course, i) => {
            const progress =
              course.lessonCount > 0
                ? (course.completedLessons / course.lessonCount) * 100
                : 0;
            const isComplete = progress === 100;

            return (
              <AnimatedItem key={course.id}>
                <Link href={`/cursos/${course.id}`}>
                  <Card hover className="overflow-hidden p-0 cursor-pointer">
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden bg-muted/20">
                      {course.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.imageUrl}
                          alt={course.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                          <h3 className="text-[15px] font-bold text-white leading-snug">
                            {course.name}
                          </h3>
                          <p className="text-[12px] text-white/70 mt-0.5">
                            {course.lessonCount} aulas
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play size={18} className="text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                    </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3">
                      {course.description}
                    </p>

                    {/* Progress */}
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-text-secondary flex items-center gap-1">
                        {isComplete ? (
                          <CheckCircle2 size={13} className="text-success-500" />
                        ) : (
                          <BookOpen size={13} />
                        )}
                        {course.completedLessons}/{course.lessonCount} aulas concluídas
                      </span>
                      <span className="font-medium text-text-secondary">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/25 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? "bg-success-500" : "bg-brand-900"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
              </AnimatedItem>
            );
          })}
        </AnimatedList>
      </div>
    </>
  );
}
