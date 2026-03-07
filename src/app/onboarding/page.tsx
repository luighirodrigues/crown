"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, User, Phone, Heart, Sparkles, ArrowRight, Check } from "lucide-react";

const INTEREST_OPTIONS = [
  "Empreendedorismo",
  "Marketing Digital",
  "Finanças",
  "Liderança",
  "Desenvolvimento Pessoal",
  "Vendas",
  "Branding",
  "Produtividade",
  "Comunicação",
  "Maternidade & Negócios",
];

const SKILL_OPTIONS = [
  "Gestão de Pessoas",
  "Social Media",
  "Design",
  "Copywriting",
  "Consultoria",
  "Coaching",
  "Tecnologia",
  "Fotografia",
  "Organização de Eventos",
  "Mentoria",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const totalSteps = 3;

  function toggleItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Seu nome é obrigatório");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, "") || undefined,
          bio: bio.trim() || undefined,
          interests,
          skills,
        }),
      });

      if (res.ok) {
        router.replace("/inicio");
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao salvar dados");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function canAdvance() {
    if (step === 0) return name.trim().length >= 2;
    return true;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="bg-brand-900 text-white px-6 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-4 right-6 w-20 h-20 border border-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-white/8 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={24} className="text-gold-500" />
            <span className="text-[13px] font-semibold tracking-wider uppercase opacity-80">
              CROWN
            </span>
          </div>
          <h1 className="text-[22px] font-bold leading-tight">
            Bem-vinda ao Reino!
          </h1>
          <p className="text-[13px] text-white/70 mt-1.5">
            Conte-nos um pouco sobre você para personalizar sua experiência.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full overflow-hidden bg-white/20"
            >
              <motion.div
                className="h-full bg-gold-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <User size={18} className="text-brand-900" />
                <h2 className="text-[16px] font-bold text-text-primary">Dados Básicos</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                    Como quer ser chamada? *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-[var(--radius-btn)] border border-muted/30 bg-white text-[14px] text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-btn)] border border-muted/30 bg-white text-[14px] text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                    Sobre você <span className="text-muted font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você, sua trajetória, seus sonhos..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-[var(--radius-btn)] border border-muted/30 bg-white text-[14px] text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all resize-none"
                  />
                  <p className="text-[11px] text-muted mt-1 text-right">{bio.length}/500</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Heart size={18} className="text-brand-900" />
                <h2 className="text-[16px] font-bold text-text-primary">Seus Interesses</h2>
              </div>
              <p className="text-[13px] text-text-secondary -mt-3">
                Selecione os temas que mais te interessam (opcional)
              </p>

              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((item) => {
                  const selected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(interests, item, setInterests)}
                      className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition-all border ${
                        selected
                          ? "bg-brand-900 text-white border-brand-900"
                          : "bg-white text-text-secondary border-muted/30 hover:border-brand-900/30"
                      }`}
                    >
                      {selected && <Check size={13} className="inline mr-1 -mt-0.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-brand-900" />
                <h2 className="text-[16px] font-bold text-text-primary">Suas Habilidades</h2>
              </div>
              <p className="text-[13px] text-text-secondary -mt-3">
                O que você sabe fazer de melhor? (opcional)
              </p>

              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((item) => {
                  const selected = skills.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(skills, item, setSkills)}
                      className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition-all border ${
                        selected
                          ? "bg-gold-500 text-brand-900 border-gold-500"
                          : "bg-white text-text-secondary border-muted/30 hover:border-gold-500/50"
                      }`}
                    >
                      {selected && <Check size={13} className="inline mr-1 -mt-0.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-danger-400 text-[13px] mt-3 text-center"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 px-5 py-4 bg-[var(--color-bg)] border-t border-muted/15">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-[var(--radius-btn)] border border-muted/30 text-[14px] font-semibold text-text-secondary hover:bg-surface transition-colors"
            >
              Voltar
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              onClick={() => canAdvance() && setStep(step + 1)}
              disabled={!canAdvance()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[14px] font-semibold hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canAdvance()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[14px] font-semibold hover:bg-brand-800 transition-colors disabled:opacity-40"
            >
              {submitting ? (
                "Salvando..."
              ) : (
                <>
                  Entrar no Reino
                  <Crown size={16} />
                </>
              )}
            </button>
          )}
        </div>

        {step < totalSteps - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full mt-2 py-2 text-[12px] text-muted hover:text-text-secondary transition-colors"
          >
            Pular por agora
          </button>
        )}
      </div>
    </div>
  );
}
