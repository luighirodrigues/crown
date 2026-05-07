"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Lightbulb, Bug, MessageSquare, Loader2, CheckCircle, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { value: "ideia", label: "Ideia", icon: Lightbulb },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "outro", label: "Outro", icon: MessageSquare },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];

interface FeedbackWidgetProps {
  className?: string;
}

export function FeedbackWidget({ className }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("ideia");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [imagePreview]);

  const resetForm = useCallback(() => {
    setType("ideia");
    setMessage("");
    setIsAnonymous(false);
    removeImage();
    setError(null);
    setSuccess(false);
  }, [removeImage]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 10) {
      setError("A mensagem deve ter pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("message", message.trim());
      formData.append("isAnonymous", String(isAnonymous));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao enviar feedback.");
      }
    } catch {
      setError("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-4 bottom-4 z-50 w-14 h-14 rounded-full bg-brand-900 text-gold-500 shadow-lg flex items-center justify-center hover:bg-brand-800 transition-colors cursor-pointer",
          className
        )}
        title="Enviar feedback"
      >
        <Crown size={24} />
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[61] max-h-[85vh] bg-bg rounded-t-2xl overflow-hidden flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-muted/40 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-gold-500" />
                  <h2 className="text-[17px] font-semibold text-text-primary">Enviar Feedback</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-text-secondary hover:bg-muted/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-4 pb-6">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-primary">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                    >
                      <CheckCircle size={48} className="text-success-500 mb-4" />
                    </motion.div>
                    <p className="text-lg font-semibold">Feedback enviado!</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Agradecemos sua contribuição.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Tipo</label>
                      <div className="flex gap-2">
                        {FEEDBACK_TYPES.map((t) => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setType(t.value)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all border",
                                type === t.value
                                  ? "bg-brand-900 text-white border-brand-900"
                                  : "bg-surface text-text-secondary border-muted/20 hover:border-brand-900/30"
                              )}
                            >
                              <Icon size={16} />
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Mensagem</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Descreva sua ideia, bug ou sugestão..."
                        rows={4}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
                        maxLength={500}
                      />
                      <p className="text-[11px] text-muted text-right">{message.length}/500</p>
                    </div>

                    {/* Image upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Imagem (opcional)</label>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-40 object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-muted/40 text-text-secondary text-[12px] hover:border-brand-900/30 hover:text-brand-900 transition-colors"
                        >
                          <ImagePlus size={14} />
                          Anexar imagem
                        </button>
                      )}
                    </div>

                    {/* Anonymous toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded border-muted/30 text-brand-900 focus:ring-brand-900/30"
                      />
                      <span className="text-sm text-text-secondary">Enviar anonimamente</span>
                    </label>

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-danger-400 bg-danger-400/10 px-3 py-2 rounded-xl">
                        {error}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Crown size={16} className="text-gold-500" />
                      )}
                      {submitting ? "Enviando..." : "Enviar Feedback"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}