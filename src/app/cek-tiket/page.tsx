"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnggotaService } from "@/lib/services/anggotaService";
import { PengajuanAnggota, Anggota } from "@/types/database";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge } from "@/components/ui/Badge";
import { KtaCard } from "@/components/cards/KtaCard";

function CekTiketContent() {
  const searchParams = useSearchParams();
  const initialTiket = searchParams.get("tiket") || "";

  const [inputTiket, setInputTiket] = useState(initialTiket);
  const [result, setResult] = useState<{
    pengajuan?: PengajuanAnggota;
    anggota?: Anggota;
  } | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (codeToSearch?: string) => {
    const code = (codeToSearch || inputTiket).trim();
    if (!code) return;
    const res = AnggotaService.getByTiket(code);
    setResult(res);
    setSearched(true);
  };

  useEffect(() => {
    if (initialTiket) {
      handleSearch(initialTiket);
    }
  }, [initialTiket]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold text-red-800 tracking-wider uppercase bg-red-100 px-3 py-1 rounded-full">
          Pelacakan Pengajuan
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-3">
          Cek Status Pengajuan & Tiket
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2">
          Masukkan kode tiket pengajuan (misal: <code>MTP-202602-001</code>) untuk mengetahui tahapan verifikasi atau catatan perbaikan.
        </p>
      </div>

      {/* Input Search Box */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-6 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={inputTiket}
            onChange={(e) => setInputTiket(e.target.value)}
            placeholder="Ketik Nomor Tiket Anda (contoh: MTP-202602-001)"
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 font-mono text-stone-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm shadow-md transition"
          >
            Lacak Status
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Kode tiket berformat: <strong className="font-mono text-stone-700">MTP-YYYYMM-XXX</strong></span>
          <span className="text-stone-400">Diterbitkan otomatis saat mengirim formulir</span>
        </div>
      </div>

      {/* Result Display */}
      {searched && (
        <div>
          {result && result.pengajuan && result.anggota ? (
            <div className="space-y-6 animate-fade-in">
              {/* Header Box */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Kode Tiket
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-amber-950">
                      {result.pengajuan.kode_tiket}
                    </span>
                  </div>
                  <div>
                    <VerifikasiBadge status={result.pengajuan.status} />
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="my-6">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-3">
                    Tahapan Proses Verifikasi
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <div className="font-bold">1. Diterima</div>
                      <div className="text-[10px] text-emerald-600">Formulir masuk sistem</div>
                    </div>
                    <div
                      className={`p-3 rounded-lg border ${
                        result.pengajuan.status !== "menunggu_verifikasi"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-amber-50 border-amber-200 text-amber-800 animate-pulse font-bold"
                      }`}
                    >
                      <div className="font-bold">2. Pemeriksaan KTA</div>
                      <div className="text-[10px]">Verifikator Ranting</div>
                    </div>
                    <div
                      className={`p-3 rounded-lg border ${
                        result.pengajuan.status === "terverifikasi"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold"
                          : result.pengajuan.status === "perlu_koreksi"
                          ? "bg-orange-100 border-orange-300 text-orange-900 font-bold"
                          : result.pengajuan.status === "ditolak"
                          ? "bg-rose-100 border-rose-300 text-rose-900 font-bold"
                          : "bg-stone-50 border-stone-200 text-stone-400"
                      }`}
                    >
                      <div className="font-bold">3. Keputusan</div>
                      <div className="text-[10px] capitalize">
                        {result.pengajuan.status.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revision Notes if Needed */}
                {result.pengajuan.catatan_revisi && (
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs mb-6">
                    <div className="flex items-center gap-2 font-bold text-sm mb-1">
                      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Catatan Koreksi dari Petugas Verifikator:
                    </div>
                    <p className="mt-1 leading-relaxed pl-7">
                      {result.pengajuan.catatan_revisi}
                    </p>
                  </div>
                )}

                {/* Submitted Data Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <div>
                    <span className="text-stone-400 block">Nama Anggota:</span>
                    <strong className="text-stone-900 text-sm block">{result.anggota.nama_lengkap}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Nomor KTA Pusat (Asli):</span>
                    <span className="font-mono font-bold text-amber-900">
                      {result.anggota.nomor_kta || "(Belum Tercatat)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Desa Subranting:</span>
                    <span className="text-stone-800 font-medium">
                      {result.anggota.desa?.nama_desa}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Tingkatan:</span>
                    <div className="mt-0.5">
                      <TingkatanBadge tingkatan={result.anggota.tingkatan} />
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Status Keaktifan:</span>
                    <div className="mt-0.5">
                      <KeaktifanBadge status={result.anggota.status_keaktifan} />
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Tanggal Pengajuan:</span>
                    <span className="text-stone-700">
                      {new Date(result.pengajuan.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* If verified: show digital card preview */}
              {result.pengajuan.status === "terverifikasi" && (
                <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-6">
                  <h3 className="font-bold text-base text-stone-900 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Arsip Identitas Anggota Terverifikasi
                  </h3>
                  <div className="flex justify-center">
                    <KtaCard anggota={result.anggota} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
              <svg className="w-12 h-12 text-stone-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-stone-800">Tiket Tidak Ditemukan</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Nomor tiket <code>{inputTiket}</code> tidak tercatat. Pastikan penulisan kode sudah sesuai dengan format <code>MTP-YYYYMM-XXX</code>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CekTiketPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100/70 font-sans">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Memuat data pelacakan...</div>}>
          <CekTiketContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
