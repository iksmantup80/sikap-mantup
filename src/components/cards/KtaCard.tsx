"use client";

import React from "react";
import { Anggota } from "@/types/database";
import { KeaktifanBadge, TingkatanBadge, VerifikasiBadge } from "../ui/Badge";

export function KtaCard({
  anggota,
  showActions = false,
}: {
  anggota: Anggota;
  showActions?: boolean;
}) {
  const isSiswa =
    anggota.kategori_anggota === "siswa" ||
    anggota.tingkatan?.startsWith("Siswa") ||
    anggota.tingkatan === "Calon Warga";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 text-white shadow-xl max-w-md w-full p-5 transition hover:shadow-2xl ${
        isSiswa
          ? "border-indigo-400 bg-gradient-to-br from-stone-900 via-stone-850 to-indigo-950"
          : "border-amber-300 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950"
      }`}
    >
      {/* Background Watermark */}
      <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-9xl font-black select-none tracking-tighter text-amber-200">
        IKSPI
      </div>

      <div className="absolute top-2 right-3 pointer-events-none">
        <span
          className={`text-[10px] uppercase tracking-widest font-mono ${
            isSiswa ? "text-indigo-300/80" : "text-amber-300/60"
          }`}
        >
          {isSiswa ? "KARTU SISWA • RANTING MANTUP" : "INTERNAL RANTING MANTUP"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-ikspi-mantup.png"
          alt="Logo IKSPI Kera Sakti Mantup"
          className="w-11 h-11 object-contain drop-shadow"
        />
        <div>
          <h4 className="font-extrabold text-base tracking-tight text-amber-100 flex items-center gap-2">
            IKSPI KERA SAKTI
          </h4>
          <p className="text-xs text-amber-300/80 font-medium">
            Ranting Mantup • Lamongan, Jawa Timur
          </p>
        </div>
      </div>

      {/* Body: Photo & Identity */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Profile Picture */}
        <div className="col-span-1 flex flex-col items-center">
          <div className="w-24 h-28 rounded-xl bg-stone-700/80 border-2 border-amber-400/60 overflow-hidden flex items-center justify-center shadow-md relative">
            {anggota.foto_profil_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anggota.foto_profil_url}
                alt={anggota.nama_lengkap}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2 text-stone-400">
                <svg
                  className="w-10 h-10 mx-auto text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-[10px] block mt-1">Pasfoto</span>
              </div>
            )}
          </div>
        </div>

        {/* Member Details */}
        <div className="col-span-2 space-y-1.5 text-xs">
          <div>
            <span className="text-stone-400 text-[10px] block uppercase font-medium">
              Nama Lengkap
            </span>
            <span className="font-bold text-sm text-white tracking-wide block truncate">
              {anggota.nama_lengkap}
            </span>
          </div>

          <div>
            <span className="text-stone-400 text-[10px] block uppercase font-medium">
              {isSiswa ? "Tempat Latihan Subranting" : "No. Induk (KTA Pusat)"}
            </span>
            <span
              className={`font-bold text-xs ${
                isSiswa ? "text-indigo-200" : "font-mono text-amber-300"
              }`}
            >
              {isSiswa
                ? anggota.tempat_latihan || "Subranting Desa Mantup"
                : anggota.nomor_kta || "(Belum Tercatat / Proses Terbit)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TingkatanBadge tingkatan={anggota.tingkatan} />
            <span className="text-[11px] font-semibold text-amber-200">
              {isSiswa
                ? `Mulai/Target: ${anggota.tahun_pengesahan}`
                : `Angkatan ${anggota.angkatan || anggota.tahun_pengesahan}`}
            </span>
          </div>

          {!isSiswa && (
            <div>
              <span className="text-stone-400 text-[10px] block uppercase font-medium">
                Tanggal Pengesahan
              </span>
              <span className="text-stone-200 font-medium">
                {anggota.tanggal_pengesahan
                  ? new Date(anggota.tanggal_pengesahan).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : String(anggota.tahun_pengesahan)}
              </span>
            </div>
          )}

          <div>
            <span className="text-stone-400 text-[10px] block uppercase font-medium">
              Wilayah Subranting / Desa
            </span>
            <span className="text-stone-200 font-medium">
              {anggota.desa?.nama_desa || "Kecamatan Mantup"}
            </span>
          </div>
        </div>
      </div>

      {/* Badges & Status */}
      <div className="mt-4 pt-3 border-t border-stone-700/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <VerifikasiBadge status={anggota.status_verifikasi} />
          <KeaktifanBadge status={anggota.status_keaktifan} />
        </div>
        <span className="text-[10px] text-stone-400 font-mono">
          ID: {anggota.id.slice(0, 8)}
        </span>
      </div>

      {/* Legal Notice */}
      <div className="mt-3 bg-stone-950/60 px-2.5 py-1.5 rounded-md border border-stone-800 text-[10px] text-stone-400 text-center">
        {isSiswa
          ? "Kartu Tanda Siswa (KTS) internal Ranting Mantup untuk pembinaan latihan sabuk."
          : "Identitas arsip database internal Ranting Mantup. Bukan KTA fisik resmi pengganti dari Pengurus Pusat Madiun."}
      </div>
    </div>
  );
}
