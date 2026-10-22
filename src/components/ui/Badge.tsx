import React from "react";
import { StatusKeaktifan, StatusVerifikasi, TingkatanWarga } from "@/types/database";

export function VerifikasiBadge({ status }: { status: StatusVerifikasi }) {
  const map: Record<StatusVerifikasi, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-300" },
    menunggu_verifikasi: {
      label: "Menunggu Verifikasi",
      className: "bg-amber-50 text-amber-800 border-amber-300",
    },
    perlu_koreksi: {
      label: "Perlu Koreksi",
      className: "bg-orange-50 text-orange-800 border-orange-300",
    },
    terverifikasi: {
      label: "Terverifikasi Sah",
      className: "bg-emerald-50 text-emerald-800 border-emerald-300",
    },
    ditolak: {
      label: "Ditolak",
      className: "bg-rose-50 text-rose-800 border-rose-300",
    },
  };

  const item = map[status] || map.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current" />
      {item.label}
    </span>
  );
}

export function KeaktifanBadge({ status }: { status: StatusKeaktifan }) {
  const map: Record<StatusKeaktifan, { label: string; className: string }> = {
    aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-900" },
    pasif: { label: "Pasif / Non-Aktif", className: "bg-slate-100 text-slate-700" },
    mutasi_keluar: { label: "Mutasi Keluar", className: "bg-blue-100 text-blue-800" },
    meninggal: { label: "Almarhum / Wafat", className: "bg-zinc-200 text-zinc-800" },
  };

  const item = map[status] || map.aktif;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  );
}

export function TingkatanBadge({ tingkatan }: { tingkatan: TingkatanWarga }) {
  const map: Record<TingkatanWarga, string> = {
    "Warga Tingkat 1": "bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold",
    "Warga Tingkat 2": "bg-blue-50 text-blue-800 border-blue-300 font-semibold",
    "Warga Tingkat 3": "bg-purple-50 text-purple-800 border-purple-300 font-semibold",
    "Pendekar / Warga Sepuh": "bg-red-50 text-red-800 border-red-300 font-bold",
    "Siswa Sabuk Kuning": "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
    "Siswa Sabuk Biru": "bg-sky-100 text-sky-900 border-sky-300 font-semibold",
    "Siswa Sabuk Merah": "bg-rose-100 text-rose-900 border-rose-300 font-semibold",
    "Calon Warga": "bg-orange-100 text-orange-950 border-orange-400 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border ${
        map[tingkatan] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {tingkatan}
    </span>
  );
}

export function KategoriBadge({ kategori }: { kategori?: "warga" | "siswa" }) {
  if (kategori === "siswa") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        🥋 Siswa Latihan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
      ⭐ Warga Disahkan
    </span>
  );
}
