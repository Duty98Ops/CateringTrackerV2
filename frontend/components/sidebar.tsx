"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Plus,
  FolderKanban,
  BarChart2,
  Search,
  Store,
  Trash2,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/add", icon: Plus, label: "Input Belanja" },
  { href: "/transactions", icon: FolderKanban, label: "Riwayat" },
  { href: "/reports", icon: BarChart2, label: "Analitik & Laporan" },
  { href: "/search", icon: Search, label: "Pencarian Bahan" },
  { href: "/suppliers", icon: Store, label: "Mitra Supplier" },
  { href: "/trash", icon: Trash2, label: "Sampah / Arsip" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Mobile hamburger button — only visible on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg shadow-lg md:hidden"
        style={{ background: "hsl(var(--sidebar-bg))", color: "#fff" }}
        aria-label="Buka menu"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar — fixed drawer on mobile, sticky column on desktop */}
      <aside
        className={cn(
          "fixed top-0 z-50 flex h-screen w-60 flex-col overflow-y-auto border-r border-slate-800/80 p-3.5 transition-transform duration-200 shadow-sm",
          "md:sticky md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ background: "hsl(var(--sidebar-bg))" }}
      >
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 text-xl text-white/70 hover:text-white md:hidden"
          aria-label="Tutup menu"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="mb-4 flex items-center gap-3 px-2 pt-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/25 text-white">
            <span className="text-lg">🍳</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">Catering</div>
            <div className="text-[11px] text-slate-400">Cost Intelligence</div>
          </div>
        </div>

        {/* Menu Section Label */}
        <div className="mb-2 mt-4 px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Menu Utama
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-2.5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/90 border border-slate-700/50 text-slate-300">
              <HardDrive className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-200 leading-tight">File-Based Data</div>
              <div className="text-[9px] text-slate-400 leading-tight">Management</div>
            </div>
            <span className="ml-auto shrink-0 text-[9px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800/70 px-1.5 py-0.5 rounded">
              MVP V1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
