"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Save, Loader2 } from "lucide-react";

interface PointsRule {
  id: string;
  key: string;
  label: string;
  points: number;
  active: boolean;
}

export default function PointsRulesPage() {
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { points?: number; active?: boolean }>>({});

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/points-rules");
      if (res.ok) setRules(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  function handleEdit(key: string, field: "points" | "active", value: number | boolean) {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  function hasChanges(rule: PointsRule) {
    const edit = edits[rule.key];
    if (!edit) return false;
    return (
      (edit.points !== undefined && edit.points !== rule.points) ||
      (edit.active !== undefined && edit.active !== rule.active)
    );
  }

  async function handleSave(rule: PointsRule) {
    const edit = edits[rule.key];
    if (!edit) return;

    setSaving(rule.key);
    try {
      const res = await fetch("/api/admin/points-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: rule.key,
          ...(edit.points !== undefined ? { points: edit.points } : {}),
          ...(edit.active !== undefined ? { active: edit.active } : {}),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRules((prev) => prev.map((r) => (r.key === updated.key ? updated : r)));
        setEdits((prev) => {
          const next = { ...prev };
          delete next[rule.key];
          return next;
        });
      }
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        Regras de Pontuação (Tributos)
      </h2>

      <div className="space-y-3">
        {rules.map((rule) => {
          const edit = edits[rule.key];
          const currentPoints = edit?.points ?? rule.points;
          const currentActive = edit?.active ?? rule.active;
          const changed = hasChanges(rule);

          return (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{rule.label}</p>
                  <p className="text-xs text-text-secondary font-mono">{rule.key}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Points input */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-text-secondary">Pontos:</label>
                    <input
                      type="number"
                      min={0}
                      value={currentPoints}
                      onChange={(e) =>
                        handleEdit(rule.key, "points", parseInt(e.target.value) || 0)
                      }
                      className="w-16 text-sm px-2 py-1 rounded-lg border border-muted/30 bg-surface text-center focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                    />
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleEdit(rule.key, "active", !currentActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currentActive ? "bg-success-500" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>

                  {/* Save button */}
                  <button
                    onClick={() => handleSave(rule)}
                    disabled={!changed || saving === rule.key}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-medium disabled:opacity-30 hover:bg-brand-800 transition-colors"
                  >
                    {saving === rule.key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
