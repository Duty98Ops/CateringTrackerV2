"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, ReferenceLine,
} from "recharts";
import {
  fetchRangeReport, fetchCategoryReport, fetchMonthlyReport,
} from "@/lib/api";
import { BarChart3, CalendarCheck, CalendarDays, CalendarRange, CircleDollarSign, Download, Filter, Package } from "lucide-react";
import type { RangeReport, CategoryReport, MonthlyReport } from "@/lib/types";
import { formatCurrency, formatCurrencyShort, getCategoryColor } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab = "range" | "monthly";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("range");

  const d30 = new Date();
  d30.setDate(d30.getDate() - 29);
  const [start, setStart] = useState(d30.toISOString().split("T")[0]);
  const [end, setEnd] = useState(new Date().toISOString().split("T")[0]);

  const [report, setReport] = useState<RangeReport | null>(null);
  const [catReport, setCatReport] = useState<CategoryReport[]>([]);
  const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);

  const monthlyPeak = monthly.reduce<MonthlyReport | null>(
    (peak, row) => (!peak || row.total > peak.total ? row : peak),
    null,
  );
  const monthlyDays = monthly.reduce((sum, row) => sum + row.days, 0);
  const monthlyItems = monthly.reduce((sum, row) => sum + row.items, 0);
  const monthlyTotal = monthly.reduce((sum, row) => sum + row.total, 0);

  const loadRange = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        fetchRangeReport(start, end),
        fetchCategoryReport(start, end),
      ]);
      setReport(r);
      setCatReport(c);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [start, end]);

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    try { setMonthly(await fetchMonthlyReport()); }
    catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "range") loadRange();
    else loadMonthly();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-blue-500 text-blue-600">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Laporan</h1>
            <p className="mt-0.5 text-xs text-slate-500">Ikhtisar biaya belanja bahan baku dan tren alokasi modal operasional katering</p>
          </div>
        </div>
        <a href="/api/export/csv" download className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700">
          <Download className="h-3.5 w-3.5" />
          Ekspor CSV
        </a>
      </div>

      {/* Tab switcher */}
      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {([
          { key: "range" as Tab, label: "Rentang Tanggal", icon: CalendarRange },
          { key: "monthly" as Tab, label: "Bulanan", icon: CalendarDays },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${tab === t.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Range Tab ────────────────────────────────── */}
      {tab === "range" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:gap-4 sm:p-4">
            <Input label="Dari" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 border-slate-200 bg-white text-sm" />
            <Input label="Sampai" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 border-slate-200 bg-white text-sm" />
            <Button onClick={loadRange} disabled={loading} className="h-11 rounded-xl bg-blue-600 px-6 text-sm hover:bg-blue-700">
              <Filter className="h-4 w-4" />
              {loading ? "Memuat..." : "Tampilkan"}
            </Button>
          </div>

          {report && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {[
                  { label: "Total Pengeluaran", value: formatCurrency(report.grand_total), sub: "Akumulasi biaya pada periode terpilih", icon: CircleDollarSign, tone: "text-amber-700 bg-amber-50" },
                  { label: "Hari dengan Data", value: String(report.days_with_data), sub: "Hari aktivitas belanja tercatat", icon: CalendarCheck, tone: "text-blue-700 bg-blue-50" },
                  { label: "Total Item", value: String(report.total_items), sub: "Jenis komoditas dibeli", icon: Package, tone: "text-emerald-700 bg-emerald-50" },
                ].map((stat) => (
                  <div key={stat.label} className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}><stat.icon className="h-4 w-4" /></span>
                    </div>
                    <div className="mt-2 whitespace-nowrap text-2xl font-black tracking-tight text-slate-900">{stat.value}</div>
                    <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {report.days.length > 0 && (
                <Card className="border-slate-100 bg-white p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Pengeluaran per Hari</h3>
                      <p className="mt-0.5 text-sm text-slate-500">Distribusi beban operasional bahan baku sepanjang periode aktif</p>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />Pengeluaran (Rp)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report.days} margin={{ top: 8, right: 8, left: 0, bottom: 2 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dbe5f3" />
                      <XAxis dataKey="date" axisLine={{ stroke: "#cbd5e1" }} tickLine={false} tick={{ fontSize: 11, fill: "#334155" }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis width={62} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={formatCurrencyShort} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), "Pengeluaran"]} contentStyle={{ borderRadius: 10, border: "0", background: "#1e293b", color: "white", fontSize: 12 }} labelStyle={{ color: "#cbd5e1" }} />
                      <Bar dataKey="day_total" fill="#059669" radius={[5, 5, 0, 0]} name="Pengeluaran" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {catReport.length > 0 && (
                <Card className="border-slate-100 bg-white p-4 sm:p-5">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Breakdown Kategori</h3>
                      <p className="mt-0.5 text-sm text-slate-500">Komposisi biaya pengeluaran bahan dasar</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{catReport.length} Kategori Tercatat</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {catReport.map((c, i) => {
                      const pct = report.grand_total > 0 ? (c.total / report.grand_total) * 100 : 0;
                      return (
                        <div key={c.key}>
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="font-medium text-slate-800">{c.icon} {c.label}</span>
                            <span className="flex items-center gap-3 text-xs sm:text-sm"><strong className="font-semibold text-slate-800">{formatCurrency(c.total)}</strong><span className="w-12 text-right text-slate-500">{pct.toFixed(1)}%</span></span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-indigo-100">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: getCategoryColor(c.key, i) }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Monthly Tab ──────────────────────────────── */}
      {tab === "monthly" && !loading && monthly.length > 0 && (
        <div className="flex flex-col gap-4 sm:gap-5">
          <Card className="border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Tren Bulanan</h3>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">{monthly.length} Periode Terdata</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">Pergerakan total biaya belanja bahan baku per periode bulan operasional</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />Realisasi Belanja Bulanan</div>
            </div>
            <ResponsiveContainer width="100%" height={255}>
              <AreaChart data={monthly} margin={{ top: 18, right: 8, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id="monthlySpendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#e7edf5" />
                <XAxis dataKey="month" axisLine={{ stroke: "#cbd5e1" }} tickLine={false} tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis width={58} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={formatCurrencyShort} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Realisasi"]} labelFormatter={(label) => `${label}${monthlyPeak?.month === label ? " (Puncak)" : ""}`} contentStyle={{ borderRadius: 10, border: "0", background: "#1e293b", color: "white", fontSize: 11 }} labelStyle={{ color: "#cbd5e1" }} />
                {monthlyPeak && <ReferenceLine x={monthlyPeak.month} stroke="#fdba74" strokeDasharray="3 3" />}
                <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2.5} fill="url(#monthlySpendFill)" activeDot={{ r: 5, fill: "#f97316", stroke: "white", strokeWidth: 2 }} dot={{ r: 3, fill: "#f97316", stroke: "white", strokeWidth: 1.5 }} name="Realisasi" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>ⓘ Data bersumber dari catatan pembukuan transaksi operasional terverifikasi</span>
              {monthlyPeak && <span className="text-slate-700">Puncak belanja tercatat pada periode <strong className="text-orange-600">{monthlyPeak.month}</strong> ({formatCurrency(monthlyPeak.total)})</span>}
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white p-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ringkasan Pengeluaran Bulanan</h3>
                <p className="mt-1 text-sm text-slate-500">Matriks kompilasi data hari belanja aktif, jumlah komoditas, dan nominal biaya</p>
              </div>
              <span className="shrink-0 rounded bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">{monthly.length} Periode Laporan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-left font-semibold sm:px-5">Bulan</th>
                    <th className="px-4 py-3 text-right font-semibold">Hari</th>
                    <th className="px-4 py-3 text-right font-semibold">Item</th>
                    <th className="px-4 py-3 text-right font-semibold sm:px-5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m, i) => {
                    const isPeak = m.month === monthlyPeak?.month;
                    const isLatest = i === monthly.length - 1;
                    return (
                      <tr key={m.month} className={`border-t border-slate-100 ${isPeak ? "bg-orange-50/30" : i % 2 ? "bg-slate-50/50" : "bg-white"}`}>
                        <td className="px-4 py-3 font-semibold text-slate-800 sm:px-5">
                          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${isPeak ? "bg-orange-500" : isLatest ? "bg-blue-500" : "bg-slate-300"}`} />
                          {m.month}
                          {isPeak && <span className="ml-2 rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-700">Puncak</span>}
                          {isLatest && <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Terbaru</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{m.days} <span className="text-slate-400">Hari</span></td>
                        <td className="px-4 py-3 text-right text-slate-700">{m.items} <span className="text-slate-400">Item</span></td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-600 sm:px-5">{formatCurrency(m.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <td className="px-4 py-3 text-xs uppercase tracking-wide sm:px-5">Total Akumulasi</td>
                    <td className="px-4 py-3 text-right">{monthlyDays} <span className="font-normal text-slate-400">Hari</span></td>
                    <td className="px-4 py-3 text-right">{monthlyItems} <span className="font-normal text-slate-400">Item</span></td>
                    <td className="px-4 py-3 text-right font-mono text-blue-600 sm:px-5">{formatCurrency(monthlyTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "monthly" && !loading && monthly.length === 0 && (
        <Card className="py-12 text-center text-muted-foreground">
          Belum ada data bulanan
        </Card>
      )}
    </div>
  );
}
