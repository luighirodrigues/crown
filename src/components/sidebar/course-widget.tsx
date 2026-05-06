"use client";

import { Card } from "@/components/card";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/lib/types";

interface CourseWidgetProps {
  course: Course | null;
}

export function SidebarCourseWidget({ course }: CourseWidgetProps) {
  if (!course) return null;

  const progress = course.lessonCount > 0
    ? Math.round((course.completedLessons / course.lessonCount) * 100)
    : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
          <BookOpen size={16} className="text-brand-900" />
          Continue Assistindo
        </h3>
        <Link href="/cursos" className="text-[12px] font-medium text-brand-900 hover:text-brand-800">
          Tudo &gt;
        </Link>
      </div>

      <Link href={`/cursos/${course.id}`} className="block group">
        <div className="rounded-xl overflow-hidden bg-gradient-to-br from-brand-900/20 to-brand-800/10 h-28 flex items-center justify-center mb-3">
          {course.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={32} className="text-brand-900/40" />
          )}
        </div>
        <h4 className="text-[13px] font-semibold text-text-primary truncate group-hover:text-brand-900 transition-colors">
          {course.name}
        </h4>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-text-secondary font-medium">
            {course.completedLessons}/{course.lessonCount}
          </span>
        </div>
      </Link>
    </Card>
  );
}
