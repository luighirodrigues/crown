"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Plus, Pencil, Trash2, X, Loader2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  link: string;
  order: number;
}

interface Course {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  lessons: Lesson[];
  _count: { lessons: number };
}

interface CourseForm {
  name: string;
  description: string;
  imageUrl: string;
}

interface LessonForm {
  title: string;
  link: string;
  order: number;
}

const emptyCourseForm: CourseForm = { name: "", description: "", imageUrl: "" };
const emptyLessonForm: LessonForm = { title: "", link: "", order: 0 };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (res.ok) setCourses(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Course CRUD ───────────────────────────────────

  function startEditCourse(c: Course) {
    setEditingCourseId(c.id);
    setCourseForm({ name: c.name, description: c.description, imageUrl: c.imageUrl || "" });
    setShowCourseForm(true);
  }

  function cancelCourseForm() {
    setShowCourseForm(false);
    setEditingCourseId(null);
    setCourseForm(emptyCourseForm);
  }

  async function handleCourseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: courseForm.name,
        description: courseForm.description,
        imageUrl: courseForm.imageUrl || undefined,
      };
      const url = editingCourseId ? `/api/admin/courses/${editingCourseId}` : "/api/admin/courses";
      const method = editingCourseId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        cancelCourseForm();
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCourse(c: Course) {
    if (!confirm(`Excluir o curso "${c.name}" e todas as suas aulas?`)) return;
    await fetch(`/api/admin/courses/${c.id}`, { method: "DELETE" });
    await fetchData();
  }

  // ─── Lesson CRUD ───────────────────────────────────

  function startAddLesson(courseId: string, nextOrder: number) {
    setEditingLessonId(null);
    setLessonForm({ ...emptyLessonForm, order: nextOrder });
    setShowLessonForm(courseId);
  }

  function startEditLesson(courseId: string, lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setLessonForm({ title: lesson.title, link: lesson.link, order: lesson.order });
    setShowLessonForm(courseId);
  }

  function cancelLessonForm() {
    setShowLessonForm(null);
    setEditingLessonId(null);
    setLessonForm(emptyLessonForm);
  }

  async function handleLessonSubmit(e: React.FormEvent, courseId: string) {
    e.preventDefault();
    setSavingLesson(true);
    try {
      if (editingLessonId) {
        const res = await fetch(`/api/admin/courses/${courseId}/lessons/${editingLessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lessonForm),
        });
        if (!res.ok) { const err = await res.json(); alert(err.error || "Erro"); return; }
      } else {
        const res = await fetch(`/api/admin/courses/${courseId}/lessons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lessonForm),
        });
        if (!res.ok) { const err = await res.json(); alert(err.error || "Erro"); return; }
      }
      cancelLessonForm();
      await fetchData();
    } finally {
      setSavingLesson(false);
    }
  }

  async function handleDeleteLesson(courseId: string, lessonId: string) {
    if (!confirm("Excluir esta aula?")) return;
    await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, { method: "DELETE" });
    await fetchData();
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Cursos</h2>
        {!showCourseForm && (
          <button
            onClick={() => {
              setEditingCourseId(null);
              setCourseForm(emptyCourseForm);
              setShowCourseForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-900 text-white text-xs font-medium hover:bg-brand-800 transition-colors"
          >
            <Plus size={14} />
            Novo Curso
          </button>
        )}
      </div>

      {/* Course Form */}
      {showCourseForm && (
        <Card className="p-4">
          <form onSubmit={handleCourseSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {editingCourseId ? "Editar Curso" : "Novo Curso"}
              </p>
              <button type="button" onClick={cancelCourseForm} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nome do Curso"
              value={courseForm.name}
              onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />
            <textarea
              placeholder="Descrição"
              value={courseForm.description}
              onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
              required
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
            />
            <input
              type="url"
              placeholder="URL da Imagem (opcional)"
              value={courseForm.imageUrl}
              onChange={(e) => setCourseForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingCourseId ? "Salvar Alterações" : "Criar Curso"}
            </button>
          </form>
        </Card>
      )}

      {/* Course List */}
      <div className="space-y-3">
        {courses.map((c) => {
          const isExpanded = expandedCourse === c.id;
          return (
            <Card key={c.id} className="p-0 overflow-hidden">
              {/* Course header */}
              <div className="p-3 flex items-start gap-3">
                {c.imageUrl && (
                  <img src={c.imageUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{c.description}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{c._count.lessons} aulas</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedCourse(isExpanded ? null : c.id)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    onClick={() => startEditCourse(c)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(c)}
                    className="p-1.5 rounded-lg text-danger-400 hover:bg-danger-400/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Lessons expandable */}
              {isExpanded && (
                <div className="border-t border-muted/20 px-3 pb-3 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-text-secondary">Aulas</p>
                    <button
                      onClick={() => startAddLesson(c.id, c.lessons.length)}
                      className="flex items-center gap-1 text-[11px] text-brand-900 font-medium hover:underline"
                    >
                      <Plus size={12} />
                      Adicionar Aula
                    </button>
                  </div>

                  {/* Lesson Form */}
                  {showLessonForm === c.id && (
                    <form onSubmit={(e) => handleLessonSubmit(e, c.id)} className="space-y-2 mb-3 p-2 bg-surface-alt rounded-xl">
                      <input
                        type="text"
                        placeholder="Título da Aula"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                        required
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                      />
                      <input
                        type="url"
                        placeholder="Link (YouTube, etc.)"
                        value={lessonForm.link}
                        onChange={(e) => setLessonForm((f) => ({ ...f, link: e.target.value }))}
                        required
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary">Ordem:</label>
                          <input
                            type="number"
                            min={0}
                            value={lessonForm.order}
                            onChange={(e) => setLessonForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingLesson}
                          className="px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-medium disabled:opacity-50 hover:bg-brand-800 transition-colors mt-3"
                        >
                          {savingLesson ? <Loader2 size={12} className="animate-spin" /> : editingLessonId ? "Salvar" : "Adicionar"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelLessonForm}
                          className="px-2 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-muted/20 mt-3"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Lesson list */}
                  {c.lessons.length === 0 && (
                    <p className="text-xs text-text-secondary text-center py-2">Nenhuma aula cadastrada.</p>
                  )}
                  {c.lessons.map((l, idx) => (
                    <div key={l.id} className="flex items-center gap-2 py-1.5 border-b border-muted/10 last:border-0">
                      <GripVertical size={12} className="text-muted flex-shrink-0" />
                      <span className="text-xs text-text-secondary w-5">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{l.title}</p>
                        <a
                          href={l.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-900 hover:underline truncate block"
                        >
                          {l.link}
                        </a>
                      </div>
                      <button
                        onClick={() => startEditLesson(c.id, l)}
                        className="p-1 rounded text-text-secondary hover:bg-surface-alt"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(c.id, l.id)}
                        className="p-1 rounded text-danger-400 hover:bg-danger-400/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
