"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/card";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { ArrowLeft, Play, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { toCourse } from "@/lib/transformers";
import type { Course } from "@/lib/types";

export default function CursoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(toCourse(data));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  async function handleWatchLesson(lessonId: string, link: string) {
    // Open the video link
    window.open(link, "_blank", "noopener,noreferrer");

    // Mark as completed
    setCompleting(lessonId);
    try {
      await fetch(`/api/courses/${id}/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      await fetchCourse();
    } finally {
      setCompleting(null);
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader title="Carregando..." />
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <AppHeader title="Curso" />
        <div className="px-4 py-8 text-center">
          <p className="text-text-secondary text-sm">Curso não encontrado.</p>
        </div>
      </>
    );
  }

  const progress =
    course.lessonCount > 0
      ? (course.completedLessons / course.lessonCount) * 100
      : 0;

  return (
    <>
      <AppHeader title={course.name} />

      <div className="px-4 py-4 space-y-4">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-brand-900 font-medium -mt-1 mb-1"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* Course header */}
        <Card className="overflow-hidden p-0">
          <div className="relative h-36 overflow-hidden bg-muted/20">
            {course.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.imageUrl}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-[16px] font-bold text-white leading-snug">{course.name}</h2>
              <p className="text-[12px] text-white/70 mt-0.5">
                {course.completedLessons}/{course.lessonCount} aulas concluídas
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-text-secondary">Progresso</span>
              <span className="font-medium text-text-secondary">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-muted/25 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100 ? "bg-success-500" : "bg-brand-900"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Description */}
        <p className="text-[13px] text-text-secondary leading-relaxed">{course.description}</p>

        {/* Playlist */}
        <div>
          <h3 className="text-[14px] font-semibold text-text-primary mb-3">
            Aulas ({course.lessonCount})
          </h3>

          <AnimatedList className="space-y-2">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, i) => (
                <AnimatedItem key={lesson.id}>
                  <button
                    onClick={() => handleWatchLesson(lesson.id, lesson.link)}
                    disabled={completing === lesson.id}
                    className="w-full text-left"
                  >
                    <Card
                      className={`p-3 flex items-center gap-3 transition-colors ${
                        lesson.completed
                          ? "border-success-500/20 bg-success-500/5"
                          : "hover:bg-surface-alt"
                      } ${completing === lesson.id ? "opacity-50" : ""}`}
                    >
                      {/* Number */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold ${
                          lesson.completed
                            ? "bg-success-500 text-white"
                            : "bg-brand-900/10 text-brand-900"
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          i + 1
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[13px] font-medium truncate ${
                            lesson.completed ? "text-text-secondary" : "text-text-primary"
                          }`}
                        >
                          {lesson.title}
                        </p>
                      </div>

                      {/* Action icon */}
                      <div className="shrink-0">
                        {lesson.completed ? (
                          <ExternalLink size={15} className="text-text-secondary" />
                        ) : (
                          <Play
                            size={15}
                            className="text-brand-900"
                            fill="currentColor"
                          />
                        )}
                      </div>
                    </Card>
                  </button>
                </AnimatedItem>
              ))
            ) : (
              <AnimatedItem>
                <Card className="p-6 text-center">
                  <p className="text-text-secondary text-sm">
                    Nenhuma aula cadastrada neste curso.
                  </p>
                </Card>
              </AnimatedItem>
            )}
          </AnimatedList>
        </div>
      </div>
    </>
  );
}
