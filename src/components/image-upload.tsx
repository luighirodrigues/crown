"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  folder: string;
  currentImageUrl?: string | null;
  variant?: "avatar" | "banner" | "inline";
  onUpload: (url: string) => void;
  className?: string;
}

export function ImageUpload({
  folder,
  currentImageUrl,
  variant = "inline",
  onUpload,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear preview when parent resets currentImageUrl (e.g. after form submit)
  useEffect(() => {
    if (!currentImageUrl && preview) {
      setPreview(null);
    }
  }, [currentImageUrl, preview]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (res.ok) {
          const data = await res.json();
          onUpload(data.url);
        } else {
          const err = await res.json();
          alert(err.error || "Erro ao enviar imagem");
          setPreview(null);
        }
      } catch {
        alert("Erro ao enviar imagem");
        setPreview(null);
      } finally {
        setUploading(false);
        // Reset input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [folder, onUpload]
  );

  const triggerInput = () => inputRef.current?.click();

  const displayUrl = preview || currentImageUrl;

  if (variant === "avatar") {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={triggerInput}
          disabled={uploading}
          className={cn(
            "absolute inset-0 z-10 rounded-full bg-black/0 hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50",
            className
          )}
          title="Alterar foto"
        >
          <span className="text-white drop-shadow">
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </span>
        </button>
      </>
    );
  }

  if (variant === "banner") {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={triggerInput}
          disabled={uploading}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full text-white text-[12px] font-medium transition-all disabled:opacity-50 cursor-pointer",
            className
          )}
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Camera size={18} />
              <span>Alterar Banner</span>
            </>
          )}
        </button>
      </>
    );
  }

  // variant === "inline"
  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {displayUrl && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full max-h-40 object-cover rounded-xl"
          />
          {!uploading && (
            <button
              onClick={() => {
                setPreview(null);
                onUpload("");
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X size={12} />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-white" />
            </div>
          )}
        </div>
      )}

      {!displayUrl && (
        <button
          onClick={triggerInput}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-muted/40 text-text-secondary text-[12px] hover:border-brand-900/30 hover:text-brand-900 transition-colors disabled:opacity-50"
        >
          <ImagePlus size={14} />
          Adicionar imagem
        </button>
      )}
    </div>
  );
}
