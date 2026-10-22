"use client";

import React, { useState } from "react";
import { AnggotaService } from "@/lib/services/anggotaService";
import { DESA_MANTUP_LIST } from "@/lib/constants/desas";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge } from "@/components/ui/Badge";
import { FormPendataan } from "@/components/forms/FormPendataan";
import { Anggota } from "@/types/database";

export default function KoordinatorDashboardPage() {
  // Demo coordinator for Desa Sukobendu (MTP-02)
  const [activeDesaId, setActiveDesaId] = useState<string>(DESA_MANTUP_LIST[1].id);
  const [showInputForm, setShowInputForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [wargaDesa, setWargaDesa] = useState<Anggota[]>(() => AnggotaService.getAll({ desa_id: DESA_MANTUP_LIST[1].id }));
  const [loading, setLoading] = useState(false);

  const activeDesa = DESA_MANTUP_LIST.find((d) => d.id === activeDesaId) || DESA_MANTUP_LIST[1];

  const reloadData = async () => {
    setLoading(true);
    try {
      const data = await AnggotaService.getAllAsync({ desa_id: activeDesaId });
      setWargaDesa(data.filter((a) => a.desa_id === activeDesaId));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    reloadData();
  }, [activeDesaId, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
            Portal Koordinator Subranting
          </span>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Wilayah Tugas: {activeDesa.nama_desa} ({activeDesa.kode_desa})
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Koordinator: <strong>{activeDesa.nama_koordinator}</strong> • Sekretariat: {activeDesa.alamat_sekretariat}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Village Switcher for Demonstration */}
          <div className="text-xs">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">Simulasi Wilayah Desa:</span>
            <select
              value={activeDesaId}
              onChange={(e) => setActiveDesaId(e.target.value)}
              className="mt-0.5 rounded-lg border border-stone-300 px-2.5 py-1.5 bg-white text-stone-800 font-medium"
            >
              {DESA_MANTUP_LIST.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama_desa} ({d.kode_desa})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={reloadData}
            disabled={loading}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 border border-stone-300"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-700" : "text-stone-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? "Sinkron..." : "Sinkronkan"}</span>
          </button>

          <button
            onClick={() => setShowInputForm(!showInputForm)}
            className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            {showInputForm ? "Tutup Form Input" : "+ Bantu Input Anggota Baru"}
          </button>
        </div>
      </div>

      {/* Form Input Modal / Collapsible */}
      {showInputForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-amber-300 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h2 className="text-base font-black text-stone-900">
              Input Dibantu Koordinator: {activeDesa.nama_desa}
            </h2>
            <button
              onClick={() => setShowInputForm(false)}
              className="text-stone-400 hover:text-stone-700 font-bold"
            >
              ✕
            </button>
          </div>
          <FormPendataan
            defaultDesaId={activeDesa.id}
            sourceRole="koordinator"
            onSuccess={() => {
              setRefreshTrigger((prev) => prev + 1);
            }}
          />
        </div>
      )}

      {/* Village Member List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900">
            Daftar Anggota Subranting {activeDesa.nama_desa} ({wargaDesa.length} Terdata)
          </h3>
          <span className="text-xs text-stone-400">
            Akses terbatas pada wilayah kerja sendiri
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Nomor KTA Pusat</th>
                <th className="py-3 px-4">Tingkatan / Angkatan</th>
                <th className="py-3 px-4">Alamat / Dusun</th>
                <th className="py-3 px-4">Keaktifan</th>
                <th className="py-3 px-4">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {wargaDesa.map((a) => (
                <tr key={a.id} className="hover:bg-amber-50/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{a.nama_lengkap}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      WA: {a.nomor_wa}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">
                    {a.nomor_kta || <span className="text-stone-400 font-normal">Belum Tercatat</span>}
                  </td>
                  <td className="py-3 px-4">
                    <TingkatanBadge tingkatan={a.tingkatan} />
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Tahun {a.tahun_pengesahan}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {a.alamat_detail} (RT/RW {a.rt_rw || "-"})
                  </td>
                  <td className="py-3 px-4">
                    <KeaktifanBadge status={a.status_keaktifan} />
                  </td>
                  <td className="py-3 px-4">
                    <VerifikasiBadge status={a.status_verifikasi} />
                    {a.catatan_verifikasi && (
                      <div className="text-[10px] text-orange-700 mt-1 max-w-xs">
                        Catatan: {a.catatan_verifikasi}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {wargaDesa.length === 0 && (
          <div className="p-8 text-center text-xs text-stone-500">
            Belum ada anggota terdata untuk wilayah {activeDesa.nama_desa}. Silakan klik tombol di atas untuk membantu warga mendaftar.
          </div>
        )}
      </div>
    </div>
  );
}
