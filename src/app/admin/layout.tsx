"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-brand-900 text-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/inicio" className="p-1 -ml-1 hover:opacity-80">
            <ArrowLeft size={20} />
          </Link>
          <Shield size={20} />
          <h1 className="text-base font-semibold">Admin</h1>
        </div>
      </header>
      <main className="flex-1 bg-bg">{children}</main>
    </div>
  );
}
