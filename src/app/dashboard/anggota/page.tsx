"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnggotaService } from "@/lib/services/anggotaService";
import { KtaCard } from "@/components/cards/KtaCard";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge } from "@/components/ui/Badge";
import { Anggota } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function AnggotaDashboardPage() {
  const [dataList, setDataList] = useState<Anggota[]>(() => AnggotaService.getAll());
  const [userRole, setUserRole] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [alamatUpdate, setAlamatUpdate] = useState("");
  const [waUpdate, setWaUpdate] = useState("");
  const [fotoKtaUpdate, setFotoKtaUpdate] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const r = sessionStorage.getItem("sikap_user_role") || "";
      const e = sessionStorage.getItem("sikap_user_email") || "";
      setUserRole(r);
      setUserEmail(e);
    }

    AnggotaService.getAllAsync().then((list) => {
      setDataList(list);
    });
  }, []);

  const anggota = dataList[0];

  React.useEffect(() => {
    if (anggota) {
      setAlamatUpdate(anggota.alamat_detail || "");
      setWaUpdate(anggota.nomor_wa || "");
      setFotoKtaUpdate(anggota.foto_kta_url || "");
    }
  }, [anggota]);

  const handleKtaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran file foto terlalu besar. Maksimal 15 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
          setFotoKtaUpdate(compressedDataUrl);
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const isAdmin =
    userRole === "admin_ranting" ||
    userRole === "verifikator" ||
    userEmail.toLowerCase().includes("iksmantup") ||
    userEmail.toLowerCase().includes("admin");

  if (!anggota) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          👤
        </div>
        <h3 className="font-extrabold text-base text-stone-900 mb-1">
          Belum Ada Data Warga Tertaut
        </h3>
        <p className="text-xs text-stone-500 mb-6 leading-relaxed">
          Database Ranting Mantup baru saja dimulai dari nol. Silakan lakukan pendataan mandiri terlebih dahulu untuk mendaftarkan data keanggotaan Anda.
        </p>
        <Link
          href="/pendataan"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          Formulir Pendataan Warga →
        </Link>
      </div>
    );
  }

  const handleProposeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anggota) return;

    setIsUpdating(true);
    try {
      await AnggotaService.updateAnggota(anggota.id, {
        alamat_detail: alamatUpdate.trim(),
        nomor_wa: waUpdate.trim(),
        foto_kta_url: fotoKtaUpdate || anggota.foto_kta_url || null,
      });

      setUpdateSuccess(true);
      const updatedList = await AnggotaService.getAllAsync();
      setDataList(updatedList);
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowUpdateModal(false);
      }, 1500);
    } catch (err) {
      console.error("Gagal update profil:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Fast-Switch Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-amber-300 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <strong className="block text-sm font-black text-stone-950">
                Jien Shoo, Administrator Ranting ({userEmail || "iksmantup80@gmail.com"})!
              </strong>
              <span className="text-xs text-stone-900 leading-tight block">
                Anda sedang melihat arsip kartu identitas pribadi Anda. Klik tombol di sebelah kanan untuk langsung masuk ke Ruang Kendali Admin & memeriksa antrean verifikasi KTA warga.
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-md"
          >
            <span>Buka Pusat Kendali Admin →</span>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-amber-200">
            Salam Persaudaraan IKSPI Kera Sakti
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 flex items-center gap-2 flex-wrap">
            <span>Jien Shoo, {anggota.nama_lengkap}!</span>
            <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
              ✋ Jien Sho
            </span>
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

            <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
              <span className="text-stone-400">Bukti Foto KTA Fisik</span>
              {anggota.foto_kta_url ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span>✓</span> Terlampir
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="text-xs text-amber-800 hover:text-amber-900 font-bold underline flex items-center gap-1"
                  >
                    <span>📷</span>
                    <span>Lihat Foto</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span>📷</span>
                  <span>+ Lampirkan Foto KTA</span>
                </button>
              )}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-stone-900 mb-1">
              Pembaruan Profil & Foto KTA
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Perbarui informasi kontak, alamat domisili, atau lampirkan foto fisik Kartu Tanda Anggota (KTA) Anda untuk verifikasi pengurus ranting.
            </p>

            {updateSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 text-center">
                ✓ Profil dan Foto KTA berhasil diperbarui!
              </div>
            ) : (
              <form onSubmit={handleProposeUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Alamat Domisili
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
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={waUpdate}
                    onChange={(e) => setWaUpdate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Foto Fisik KTA Pusat (Asli)
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2">
                    Foto KTA fisik yang jelas dan terbaca nomor seri untuk verifikasi pengurus.
                  </p>

                  {fotoKtaUpdate ? (
                    <div className="relative mb-2 inline-block border-2 border-amber-500 rounded-xl overflow-hidden shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoKtaUpdate}
                        alt="Preview Foto KTA Fisik"
                        className="max-h-44 max-w-full object-contain bg-stone-900"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoKtaUpdate("")}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs shadow-md"
                        title="Hapus foto"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}

                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-xl cursor-pointer bg-stone-50 hover:bg-amber-50/50 transition">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs font-bold text-stone-700">
                      {fotoKtaUpdate ? "Ganti Foto KTA Fisik" : "Ambil / Unggah Foto Fisik KTA"}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      Kamera HP langsung atau galeri file (JPG/PNG)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleKtaFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setShowUpdateModal(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-400 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    {isUpdating ? "Menyimpan Data..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal View Foto KTA Fisik */}
      {showPhotoModal && anggota.foto_kta_url && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">📷</span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Foto Bukti KTA Fisik — {anggota.nama_lengkap}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="text-stone-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="py-4 flex items-center justify-center bg-black/40 rounded-xl my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={anggota.foto_kta_url}
                alt="Foto KTA Fisik"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-stone-400 pt-2">
              <span>Nomor KTA: <strong className="text-white">{anggota.nomor_kta || "-"}</strong></span>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
