"use client";

import React, { useState } from "react";
import { AnggotaService } from "@/lib/services/anggotaService";
import { Anggota, StatusVerifikasi } from "@/types/database";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge } from "@/components/ui/Badge";

export default function VerifikatorDashboardPage() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>(() => AnggotaService.getAll());
  const [selectedItem, setSelectedItem] = useState<Anggota | null>(null);
  const [catatan, setCatatan] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const reloadData = async () => {
    setLoading(true);
    try {
      const list = await AnggotaService.getAllAsync();
      setAnggotaList(list);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    reloadData();
  }, []);

  const antreanVerifikasi = anggotaList.filter(
    (a) => a.status_verifikasi === "menunggu_verifikasi" || a.status_verifikasi === "perlu_koreksi"
  );

  const riwayatVerifikasi = anggotaList.filter(
    (a) => a.status_verifikasi === "terverifikasi" || a.status_verifikasi === "ditolak"
  );

  const handleDecision = async (newStatus: StatusVerifikasi) => {
    if (!selectedItem) return;

    if ((newStatus === "perlu_koreksi" || newStatus === "ditolak") && !catatan.trim()) {
      alert("Wajib menuliskan catatan alasan/koreksi untuk anggota yang ditolak atau diminta koreksi!");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await AnggotaService.prosesVerifikasiAsync(
        selectedItem.id,
        newStatus,
        catatan.trim() || "Verifikasi dokumen dan nomor KTA sesuai.",
        "Petugas Verifikator Ranting"
      );

      if (res.success) {
        setActionNotice(`Status pengajuan ${selectedItem.nama_lengkap} berhasil diubah menjadi '${newStatus}'.`);
        setSelectedItem(null);
        setCatatan("");
        await reloadData();
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
            Panel Kerja Verifikasi & Admin Ranting
          </span>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Antrean Pemeriksaan Dokumen KTA Fisik
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Periksa keaslian nomor KTA fisik resmi pusat, keabsahan tingkatan, dan kelengkapan identitas warga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadData}
            disabled={loading}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 border border-stone-300"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-700" : "text-stone-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? "Menyinkronkan..." : "Sinkronkan Cloud"}</span>
          </button>

          <a
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <span>Pusat Kendali Admin →</span>
          </a>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in">
          ✓ {actionNotice}
        </div>
      )}

      {/* Main Grid: Queue & Review Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
              Antrean Masuk ({antreanVerifikasi.length})
            </h2>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
              Menunggu Keputusan
            </span>
          </div>

          <div className="space-y-2">
            {antreanVerifikasi.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setCatatan(item.catatan_verifikasi || "");
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-amber-50/80 border-amber-500 shadow-md ring-1 ring-amber-400"
                      : "bg-white border-stone-200 hover:border-amber-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        <span>{item.nama_lengkap}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-900 mt-0.5">
                        KTA: {item.nomor_kta || "(Belum Tercatat)"}
                      </div>
                    </div>
                    <VerifikasiBadge status={item.status_verifikasi} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
                    <span>{item.desa?.nama_desa}</span>
                    <span>Angkatan {item.tahun_pengesahan}</span>
                  </div>
                </div>
              );
            })}

            {antreanVerifikasi.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                Tidak ada antrean baru. Semua pengajuan telah diverifikasi!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detail & Decision Workspace */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">
                    Memeriksa Pengajuan ID: {selectedItem.id}
                  </span>
                  <h3 className="text-lg font-black text-stone-900">
                    {selectedItem.nama_lengkap}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <TingkatanBadge tingkatan={selectedItem.tingkatan} />
                  <KeaktifanBadge status={selectedItem.status_keaktifan} />
                </div>
              </div>

              {/* Identity & Subranting Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 block">Nomor KTA Pusat (Fisik):</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {selectedItem.nomor_kta || "(Belum Mengisi KTA)"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Desa Subranting:</span>
                  <span className="font-medium text-stone-800">
                    {selectedItem.desa?.nama_desa}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Tempat, Tanggal Lahir:</span>
                  <span>{selectedItem.tempat_lahir}, {selectedItem.tanggal_lahir}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Kontak WhatsApp:</span>
                  <span className="font-mono text-stone-800">{selectedItem.nomor_wa}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Pengesahan / Tempat:</span>
                  <span>Tahun {selectedItem.tahun_pengesahan} • {selectedItem.tempat_pengesahan}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Alamat Domisili:</span>
                  <span>{selectedItem.alamat_detail} (RT/RW {selectedItem.rt_rw || "-"})</span>
                </div>
              </div>

              {/* Photo Evidence Preview */}
              <div>
                <span className="text-xs font-bold text-stone-700 block mb-2">
                  Bukti Fisik KTA / Kartu Anggota:
                </span>
                <div className="h-40 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center p-3 overflow-hidden">
                  {selectedItem.foto_kta_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedItem.foto_kta_url}
                      alt="Foto Fisik KTA"
                      className="max-h-full rounded-lg object-contain shadow-xs"
                    />
                  ) : (
                    <span className="text-xs text-stone-400">
                      Calon anggota belum melampirkan foto kartu KTA.
                    </span>
                  )}
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Catatan Verifikator (Wajib diisi jika perlu perbaikan / ditolak)
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan catatan verifikasi (misal: 'Foto KTA buram, mohon foto ulang nomor seri dengan jelas' atau 'Disetujui sah')."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t flex flex-wrap items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision("ditolak")}
                  className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 disabled:opacity-50 rounded-xl font-bold transition"
                >
                  {isProcessing ? "Menyimpan..." : "Tolak Pengajuan"}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision("perlu_koreksi")}
                  className="px-4 py-2 bg-orange-50 text-orange-800 border border-orange-300 hover:bg-orange-100 disabled:opacity-50 rounded-xl font-bold transition"
                >
                  {isProcessing ? "Menyimpan..." : "Minta Koreksi (Revisi)"}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision("terverifikasi")}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>{isProcessing ? "Menyimpan ke Cloud..." : "Setujui (Terverifikasi Sah)"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-400 text-xs">
              Pilih salah satu calon anggota dari antrean di sebelah kiri untuk memeriksa berkas dan menentukan status verifikasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
