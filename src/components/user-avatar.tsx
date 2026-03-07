"use client";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  goldBorder?: boolean;
  className?: string;
}

const sizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

export function UserAvatar({ src, name, size = "md", goldBorder = false, className }: UserAvatarProps) {
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden shrink-0 bg-surface-alt",
        sizes[size],
        goldBorder && "ring-2 ring-gold-500 ring-offset-1 ring-offset-bg",
        className
      )}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
