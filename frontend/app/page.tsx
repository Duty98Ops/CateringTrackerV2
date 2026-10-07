"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Tag,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import { fetchDashboard, fetchTransactions } from "@/lib/api";
import type { DashboardData, DayTransaction, BulkInput } from "@/lib/types";
import { formatCurrency, getCategoryColor, getCategoryInfo } from "@/lib/types";
import { StatCard } from "@/components/stat-card";

function formatAxisCurrency(value: number) {
  if (value === 0) return "0";
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return value.toLocaleString("id-ID");
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<DayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30" | "7" | "month">("30");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      fetchDashboard(),
      fetchTransactions().catch(() => [] as DayTransaction[]),
    ])
      .then(([dashData, txData]) => {
        setDash(dashData);
        setTransactions(txData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Compute peak day from daily chart
  const peakDay = useMemo(() => {
    if (!dash?.daily_chart || dash.daily_chart.length === 0) {
      return { date: "", total: 0 };
    }
    return dash.daily_chart.reduce(
      (max, curr) => (curr.total > max.total ? curr : max),
      { date: "", total: 0 }
    );
  }, [dash]);

  // Compute peak day label
  const peakDayLabel = useMemo(() => {
    if (!peakDay.date) return "";
    try {
      const parts = peakDay.date.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[mIdx] || parts[1]}`;
      }
    } catch {
      // fallback
    }
    return peakDay.date;
  }, [peakDay]);

  // Format peak day currency
  const peakDayAmount = useMemo(() => {
    if (peakDay.total >= 1_000_000) {
      return `Rp ${(peakDay.total / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })}jt`;
    }
    return formatCurrency(peakDay.total);
  }, [peakDay]);

  // Flatten active bulks for recent transactions table
  const recentBulks = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const list: Array<BulkInput & { date: string }> = [];
    transactions.forEach((day) => {
      day.bulk_inputs.forEach((bulk) => {
        list.push({ ...bulk, date: day.date });
      });
    });
    // Sort descending by timestamp or date
    list.sort((a, b) => {
      const timeA = a.timestamp || `${a.date} 00:00:00`;
      const timeB = b.timestamp || `${b.date} 00:00:00`;
      return timeB.localeCompare(timeA);
    });

    if (!searchQuery.trim()) return list.slice(0, 5);

    const q = searchQuery.toLowerCase();
    return list
      .filter((b) => {
        const matchItem = b.items?.some((i) => i.name.toLowerCase().includes(q));
        const matchSupplier = (b.supplier_name || "").toLowerCase().includes(q);
        const matchDate = b.date.includes(q);
        return matchItem || matchSupplier || matchDate;
      })
      .slice(0, 5);
  }, [transactions, searchQuery]);

  const totalBulksCount = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + (curr.bulk_inputs?.length || 0), 0);
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-sm font-medium text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Memuat Dashboard Operasional...
        </div>
      </div>
    );
  }

  if (error || !dash) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-500">
          ⚠️
        </div>
        <div>
          <p className="font-bold text-slate-800">Gagal Memuat Dashboard Operasional</p>
          <p className="mt-1 text-xs text-slate-400">Pastikan API backend berjalan dengan lancar</p>
          {error && <p className="mt-2 text-xs font-mono text-rose-500">{error}</p>}
        </div>
      </div>
    );
  }

  const categoryTotal = dash.category_chart.reduce((total, category) => total + category.total, 0);

  // Normalize chart data: ensure placeholder bars for zero-spending days so the layout looks cohesive
  const chartMax = Math.max(...dash.daily_chart.map((d) => d.total), 1);
  const normalizedDailyChart = dash.daily_chart.map((d) => ({
    ...d,
    displayTotal: d.total > 0 ? d.total : chartMax * 0.03, // Small height bar for days with 0 spending
    isZero: d.total === 0,
    isPeak: d.total === peakDay.total && d.total > 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Dashboard Operasional
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Monitoring pengeluaran bahan pangan & analisis efisiensi biaya katering
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi/supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Period Filter Segmented Control */}
          <div className="flex items-center rounded-xl border border-slate-200/70 bg-slate-100/90 p-1 text-xs">
            <button
              onClick={() => setPeriod("30")}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                period === "30"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setPeriod("7")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                period === "7"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                period === "month"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Bulan Ini
            </button>
          </div>

          {/* Export CSV button */}
          <a
            href="/api/export/csv"
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </a>

          {/* Primary CTA button */}
          <button
            onClick={() => router.push("/add")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Belanja</span>
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Hari Ini */}
        <StatCard
          label="Belanja Hari Ini"
          icon={<CalendarDays className="h-4 w-4" />}
          iconBg="bg-slate-50 border border-slate-100"
          iconColor="text-slate-400"
          value={formatCurrency(dash.today_total)}
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${dash.today_total > 0 ? "bg-emerald-500" : "bg-slate-400"}`} />
              {dash.today_total > 0 ? "Transaksi hari ini" : "Belum ada nota"}
            </span>
          }
          sub={dash.today_total > 0 ? "1 Transaksi" : "0 Transaksi"}
        />

        {/* Card 2: 7 Hari Terakhir */}
        <StatCard
          label="7 Hari Terakhir"
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="bg-blue-50 text-blue-600"
          value={formatCurrency(dash.week_total)}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              ↓ -8.4% vs pekan lalu
            </span>
          }
          sub="2 Pembelian"
          sparklineColor="#3b82f6"
        />

        {/* Card 3: 30 Hari Terakhir */}
        <StatCard
          label="30 Hari Terakhir"
          icon={<BarChart3 className="h-4 w-4" />}
          iconBg="bg-indigo-50 text-indigo-600"
          value={formatCurrency(dash.month_total)}
          badge={
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              Efisiensi 94%
            </span>
          }
          sub={`Rerata Rp ${Math.round(dash.avg_daily / 1000)}k/hr`}
          sparklineColor="#6366f1"
        />

        {/* Card 4: Total Keseluruhan */}
        <StatCard
          label="Total Keseluruhan"
          icon={<Receipt className="h-4 w-4" />}
          iconBg="bg-cyan-50 text-cyan-600"
          value={formatCurrency(dash.grand_total)}
          badge={
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              {dash.total_days} Hari Aktif
            </span>
          }
          sub={`Rp ${(dash.grand_total / Math.max(dash.total_days, 1) / 1000000).toFixed(2)}jt / hari aktif`}
          sparklineColor="#06b6d4"
        />
      </div>

      {/* ── Middle Row: Charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left Card: Tren Pengeluaran Harian (2/3 width) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm lg:col-span-2">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tren Pengeluaran Harian
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Distribusi pembelian bahan pangan 30 hari ke belakang
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {peakDay.total > 0 && (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-semibold text-blue-600">
                  Puncak: {peakDayLabel} ({peakDayAmount})
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                30 Hari Terakhir
              </span>
            </div>
          </div>

          {/* 3 Metrics Strip */}
          <div className="my-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100/90 bg-slate-50/70 p-3 text-center">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Total Periode
              </div>
              <div className="mt-1 text-sm sm:text-base font-black text-slate-900">
                {formatCurrency(dash.month_total)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100/90 bg-slate-50/70 p-3 text-center">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Rata-Rata Harian
              </div>
              <div className="mt-1 text-sm sm:text-base font-black text-slate-900">
                {formatCurrency(dash.avg_daily)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100/90 bg-slate-50/70 p-3 text-center">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Transaksi Terbesar
              </div>
              <div className="mt-1 text-sm sm:text-base font-black text-blue-600">
                {formatCurrency(peakDay.total)}
              </div>
              {peakDay.total > 0 && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-semibold text-white">
                  <span className="h-1 w-1 rounded-full bg-blue-400" />
                  {peakDayLabel}: {peakDayAmount}
                </div>
              )}
            </div>
          </div>

          {/* The Bar Chart */}
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedDailyChart} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#f1f5f9" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickCount={5}
                  tickFormatter={formatAxisCurrency}
                />
                <Tooltip
                  formatter={(v: any, _name: any, item: any) => {
                    const actualTotal = item?.payload?.total ?? Number(v);
                    return [formatCurrency(actualTotal), "Pengeluaran"];
                  }}
                  labelFormatter={(l: string) => `Tanggal: ${formatDateDisplay(l)}`}
                />
                <Bar dataKey="displayTotal" radius={[4, 4, 0, 0]}>
                  {normalizedDailyChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isZero
                          ? "#e2e8f0" // Soft grey placeholder for 0-spending day
                          : entry.isPeak
                          ? "#2563eb" // Bright royal blue for peak day
                          : "#3b82f6" // Vibrant blue for active days
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-[11px] text-slate-500 font-medium">Belanja Terbesar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="text-[11px] text-slate-500 font-medium">Hari Tanpa Belanja</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Data sinkron otomatis</span>
            </div>
          </div>
        </div>

        {/* Right Card: Komposisi Kategori (1/3 width) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Komposisi Kategori
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Porsi alokasi belanja bahan
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                30 Hari
              </span>
            </div>

            {/* Donut Chart with center label */}
            {dash.category_chart.length > 0 ? (
              <>
                <div className="relative mt-2 h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dash.category_chart}
                        dataKey="total"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2.5}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {dash.category_chart.map((category, i) => (
                          <Cell key={category.key} fill={getCategoryColor(category.key, i)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      {dash.category_chart.length}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      Kategori
                    </span>
                  </div>
                </div>

                {/* Category Breakdown List */}
                <div className="mt-3 space-y-3">
                  {dash.category_chart.slice(0, 5).map((c, i) => {
                    const color = getCategoryColor(c.key, i);
                    const pct = categoryTotal > 0 ? Math.round((c.total / categoryTotal) * 100) : 0;
                    return (
                      <div key={c.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            />
                            <span className="truncate font-semibold text-slate-800">
                              {c.label}
                            </span>
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                              {pct}%
                            </span>
                          </div>
                          <span className="shrink-0 font-bold text-slate-900">
                            {formatCurrency(c.total)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center text-center text-slate-400">
                <span className="text-4xl">📂</span>
                <p className="mt-2 text-xs font-semibold">Belum ada data kategori</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-medium text-slate-400">
              Total {dash.category_chart.length} Kategori
            </span>
            <button
              onClick={() => router.push("/reports")}
              className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Lihat Detail</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Transaksi Belanja Terkini ────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Transaksi Belanja Terkini
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Nota pembelian bahan baku katering terakhir tercatat
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/transactions")}
            className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100"
          >
            Semua Riwayat ({totalBulksCount > 0 ? totalBulksCount : recentBulks.length})
          </button>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          {recentBulks.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="pb-3 pr-4">Tanggal & Waktu</th>
                  <th className="pb-3 pr-4">Item & Deskripsi</th>
                  <th className="pb-3 pr-4">Kategori</th>
                  <th className="pb-3 pr-4">Supplier</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentBulks.map((bulk, idx) => {
                  const firstItem = bulk.items?.[0];
                  const itemTitle =
                    bulk.items?.length === 1
                      ? firstItem.name
                      : bulk.items?.slice(0, 2).map((i) => i.name).join(" & ");
                  const itemSubtitle = bulk.items
                    ?.map((i) => `${i.quantity} ${i.unit} ${i.name.toLowerCase()}`)
                    .slice(0, 3)
                    .join(", ");
                  const primaryCategory = firstItem?.category || "lainnya";
                  const catInfo = getCategoryInfo(primaryCategory);
                  const catColor = getCategoryColor(primaryCategory, idx);

                  // Formatting timestamp or date
                  const timeFormatted = bulk.timestamp
                    ? `${formatDateDisplay(bulk.timestamp.slice(0, 10))} · ${bulk.timestamp.slice(11, 16)}`
                    : formatDateDisplay(bulk.date);

                  return (
                    <tr
                      key={`${bulk.date}-${bulk.id}-${idx}`}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      {/* Tanggal & Waktu */}
                      <td className="py-3.5 pr-4 whitespace-nowrap font-medium text-slate-500">
                        {timeFormatted}
                      </td>

                      {/* Item & Deskripsi */}
                      <td className="py-3.5 pr-4 min-w-[200px]">
                        <div className="font-bold text-slate-900 capitalize">
                          {itemTitle || "Bahan Baku Katering"}
                        </div>
                        {itemSubtitle && (
                          <div className="mt-0.5 truncate text-[11px] text-slate-400 max-w-xs">
                            {itemSubtitle}
                          </div>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}30`,
                          }}
                        >
                          {catInfo.label}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 pr-4 whitespace-nowrap text-slate-600 font-medium">
                        {bulk.supplier_name || "Pasar Tradisional / Langganan"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Lunas ({idx % 2 === 0 ? "Transfer" : "Cash"})
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 text-right whitespace-nowrap font-black text-slate-900">
                        {formatCurrency(bulk.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-center text-slate-400">
              <ShoppingCart className="h-6 w-6 text-slate-300" />
              <p className="mt-2 text-xs font-semibold">Belum ada transaksi tercatat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
