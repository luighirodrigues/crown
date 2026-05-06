"use client";

import { Card } from "@/components/card";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import type { CrownEvent } from "@/lib/types";

interface EventWidgetProps {
  event: CrownEvent | null;
}

export function SidebarEventWidget({ event }: EventWidgetProps) {
  if (!event) return null;

  const d = new Date(event.datetime);
  const day = d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" });
  const month = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
          <CalendarDays size={16} className="text-brand-900" />
          Próximo Evento
        </h3>
        <Link href="/inicio" className="text-[12px] font-medium text-brand-900 hover:text-brand-800">
          Veja agenda &gt;
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-14 h-16 rounded-xl bg-brand-900/8 flex flex-col items-center justify-center shrink-0">
          <span className="text-[18px] font-bold text-brand-900 leading-tight">{day}</span>
          <span className="text-[10px] font-semibold text-brand-900/70 uppercase">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-text-primary truncate">{event.title}</h4>
          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{event.description}</p>
        </div>
      </div>
    </Card>
  );
}
