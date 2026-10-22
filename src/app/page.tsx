"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnggotaService } from "@/lib/services/anggotaService";
import { DESA_MANTUP_LIST } from "@/lib/constants/desas";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { KtaCard } from "@/components/cards/KtaCard";

export default function HomePage() {
  const stats = AnggotaService.getStatistik();
  const demoAnggotaList = AnggotaService.getAll();
  const [selectedDesa, setSelectedDesa] = useState<string>("all");

  const filteredDesas = selectedDesa === "all" 
    ? stats.sebaranDesa 
    : stats.sebaranDesa.filter(d => d.id === selectedDesa);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 text-white py-16 sm:py-24 border-b border-amber-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Administrasi Mandiri Ranting Mantup, Lamongan
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Tertib Administrasi,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
                  Guyub Persaudaraan
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Platform database internal anggota <strong>IKSPI Kera Sakti Ranting Mantup</strong>. 
                Mendata warga lama, baru, aktif, maupun pasif di 15 desa wilayah kerja Kecamatan Mantup dengan verifikasi KTA resmi yang valid dan akurat.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/pendataan"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-700 hover:from-red-700 hover:to-amber-800 text-white font-bold text-base shadow-lg shadow-amber-900/30 transition transform hover:-translate-y-0.5"
                >
                  <span>Formulir Pendataan Mandiri</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <Link
                  href="/cek-tiket"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold text-base border border-stone-700 transition"
                >
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Cek Status Tiket</span>
                </Link>
              </div>

              {/* Notice Banner */}
              <div className="pt-2 text-xs text-stone-400 flex items-center justify-center lg:justify-start gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Mencatat nomor KTA fisik resmi pusat. Tidak membuat KTA pengganti.</span>
              </div>
            </div>

            {/* Right Column: Workflow Steps Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-stone-900/90 border border-amber-500/40 rounded-2xl p-6 text-white shadow-2xl backdrop-blur-xs">
                <div className="flex items-center gap-3 border-b border-stone-800 pb-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-lg shadow-inner">
                    IK
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-100">Tahapan Pendataan Warga</h3>
                    <p className="text-[11px] text-stone-400">Ranting Mantup, Kab. Lamongan</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-3 bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <div>
                      <strong className="text-stone-200 block text-xs">Siapkan Identitas & KTA Fisik</strong>
                      <span className="text-[11px] text-stone-400">Nomor KTA resmi Pusat Madiun dan data KTP.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <div>
                      <strong className="text-stone-200 block text-xs">Pilih Desa Subranting</strong>
                      <span className="text-[11px] text-stone-400">Pilih salah satu dari 15 desa wilayah Kec. Mantup.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <div>
                      <strong className="text-stone-200 block text-xs">Dapatkan Nomor Tiket</strong>
                      <span className="text-[11px] text-stone-400">Simpan tiket untuk memantau status verifikasi.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-800">
                  <Link
                    href="/pendataan"
                    className="w-full block text-center py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Mulai Isi Formulir Sekarang →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS COUNTERS */}
      <section className="bg-white border-b border-stone-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Total Anggota Terdata
              </span>
              <span className="text-3xl font-black text-amber-900 mt-1 block">
                {stats.total}
              </span>
              <span className="text-[11px] text-stone-500 mt-1 block">Warga Terdaftar</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Terverifikasi Sah
              </span>
              <span className="text-3xl font-black text-emerald-800 mt-1 block">
                {stats.terverifikasi}
              </span>
              <span className="text-[11px] text-emerald-700 mt-1 block">KTA Fisik Valid</span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Menunggu Verifikasi
              </span>
              <span className="text-3xl font-black text-blue-900 mt-1 block">
                {stats.menunggu}
              </span>
              <span className="text-[11px] text-blue-700 mt-1 block">Antrean Petugas</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Wilayah Subranting
              </span>
              <span className="text-3xl font-black text-purple-900 mt-1 block">
                15 Desa
              </span>
              <span className="text-[11px] text-purple-700 mt-1 block">Kecamatan Mantup</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIK PEMETAAN SEBARAN DESA */}
      <section id="statistik" className="py-16 bg-stone-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-red-700 tracking-wider uppercase">
              Pemetaan Subranting
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              Sebaran Warga di 15 Desa Kec. Mantup
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Struktur pembagian wilayah terkonfirmasi pengurus ranting untuk koordinasi silaturahmi dan kegiatan latihan.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2">
              <label htmlFor="desaSelect" className="text-xs font-semibold text-stone-700 uppercase">
                Filter Desa:
              </label>
              <select
                id="desaSelect"
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="text-sm rounded-lg border border-stone-300 py-1.5 px-3 bg-white text-stone-900 font-medium"
              >
                <option value="all">Semua 15 Desa</option>
                {DESA_MANTUP_LIST.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_desa} ({d.kode_desa})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-stone-500">
              Menampilkan {filteredDesas.length} subranting desa
            </span>
          </div>

          {/* Villages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDesas.map((desa) => (
              <div
                key={desa.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {desa.kode_desa}
                    </span>
                    <h3 className="font-bold text-base text-stone-900 mt-1.5">
                      {desa.nama_desa}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-900 block">
                      {desa.jumlahAnggota}
                    </span>
                    <span className="text-[10px] text-stone-500 uppercase">
                      Warga Terdata
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 text-xs space-y-1.5 text-stone-600">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Koordinator:</span>
                    <span className="font-medium text-stone-800">
                      {desa.nama_koordinator || "Belum Ditugaskan"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Kontak:</span>
                    <span className="font-mono text-stone-700">
                      {desa.kontak_koordinator || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/pendataan?desa=${desa.id}`}
                    className="w-full text-center text-xs font-semibold py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 transition"
                  >
                    + Daftar dari Desa Ini
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINSIP KEAMANAN & PANDUAN PENDATAAN */}
      <section className="py-16 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-stone-900 mb-2">
                Nomor KTA Asli Pusat Madiun
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Nomor KTA wajib merujuk langsung pada kartu fisik yang diterbitkan Pengurus Pusat. SIKAP Mantup tidak pernah membuat nomor KTA pengganti atau rekayasa.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-stone-900 mb-2">
                Anti-Duplikasi Otomatis
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Sistem secara otomatis mendeteksi jika nomor KTA, kembar identitas (nama + tanggal lahir), atau kontak terdaftar lebih dari satu kali untuk menjaga kemurnian database.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-stone-900 mb-2">
                Pemisahan Keaktifan & Verifikasi
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Status keaktifan (aktif/pasif/mutasi/meninggal) dipisahkan secara tegas dari status verifikasi dokumen (menunggu/perlu koreksi/disetujui).
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
