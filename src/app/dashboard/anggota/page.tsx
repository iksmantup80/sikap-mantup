"use client";

import React, { useState } from "react";
import { AnggotaService } from "@/lib/services/anggotaService";
import { KtaCard } from "@/components/cards/KtaCard";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge } from "@/components/ui/Badge";

export default function AnggotaDashboardPage() {
  // Demo active logged-in member: Mochamad Arifin (demo-001)
  const anggota = AnggotaService.getById("demo-001");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [alamatUpdate, setAlamatUpdate] = useState(anggota?.alamat_detail || "");
  const [waUpdate, setWaUpdate] = useState(anggota?.nomor_wa || "");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  if (!anggota) {
    return <div className="p-8 text-center text-xs text-stone-500">Data profil anggota tidak ditemukan.</div>;
  }

  const handleProposeUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(true);
    setTimeout(() => {
      setUpdateSuccess(false);
      setShowUpdateModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">
            Portal Warga Mandiri
          </span>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Selamat Datang, {anggota.nama_lengkap}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Warga IKSPI Kera Sakti • Ranting Mantup, Kec. Mantup, Lamongan
          </p>
        </div>

        <button
          onClick={() => setShowUpdateModal(true)}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          Usulkan Pembaruan Profil
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Digital Card View */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Kartu Tanda Anggota Digital (Internal Ranting)
            </span>
          </div>
          <KtaCard anggota={anggota} />
        </div>

        {/* Right Column: Member Bio & Status Details */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-stone-900 border-b pb-3">
            Informasi Keanggotaan Terdaftar
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Status Verifikasi</span>
              <VerifikasiBadge status={anggota.status_verifikasi} />
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Status Keaktifan</span>
              <KeaktifanBadge status={anggota.status_keaktifan} />
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Nomor KTA Pusat (Fisik)</span>
              <span className="font-mono font-bold text-amber-900 text-sm">
                {anggota.nomor_kta || "Belum Tercatat"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Tingkatan Warga</span>
              <TingkatanBadge tingkatan={anggota.tingkatan} />
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Tahun & Tempat Pengesahan</span>
              <span className="font-medium text-stone-800">
                Tahun {anggota.tahun_pengesahan} • {anggota.tempat_pengesahan}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Wilayah Subranting / Desa</span>
              <span className="font-bold text-stone-900">
                {anggota.desa?.nama_desa}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Alamat Domisili</span>
              <span className="text-stone-800 text-right max-w-xs">
                {anggota.alamat_detail} (RT/RW {anggota.rt_rw})
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-stone-400">Nomor WhatsApp</span>
              <span className="font-mono text-stone-800">{anggota.nomor_wa}</span>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] text-stone-500">
            <strong>Privasi & Keamanan Data:</strong> Sesuai kebijakan keamanan SIKAP Mantup dan RBAC (Role-Based Access Control), Anda hanya dapat mengakses data pribadi Anda sendiri. Data pribadi warga lain dilindungi dan tidak dapat diakses tanpa izin administratif.
          </div>
        </div>
      </div>

      {/* Propose Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-stone-900 mb-2">
              Usulkan Pembaruan Profil
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Usulan perubahan kontak dan domisili akan ditinjau oleh koordinator desa sebelum diperbarui pada master database.
            </p>

            {updateSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 text-center">
                ✓ Usulan berhasil dikirim ke antrean pengurus!
              </div>
            ) : (
              <form onSubmit={handleProposeUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Alamat Domisili Baru
                  </label>
                  <textarea
                    rows={2}
                    value={alamatUpdate}
                    onChange={(e) => setAlamatUpdate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Nomor WhatsApp Baru
                  </label>
                  <input
                    type="text"
                    value={waUpdate}
                    onChange={(e) => setWaUpdate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Kirim Usulan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
