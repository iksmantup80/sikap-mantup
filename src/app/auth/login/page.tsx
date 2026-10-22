"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UserRole } from "@/types/database";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin_ranting");
  const [email, setEmail] = useState("iksmantup80@gmail.com");
  const [password, setPassword] = useState("1Jogodong!");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === "admin_ranting") {
      setEmail("iksmantup80@gmail.com");
      setPassword("1Jogodong!");
    } else if (role === "koordinator_subranting") {
      setEmail("koordinator.sukobendu@sikapmantup.internal");
      setPassword("123456");
    } else {
      setEmail("warga.mantup@sikapmantup.internal");
      setPassword("123456");
    }
  };

  const handleLoginRole = (role: UserRole, customEmail: string) => {
    setLoading(true);
    setErrorMessage(null);

    // Simpan data login aktif di sessionStorage
    sessionStorage.setItem("sikap_user_role", role);
    sessionStorage.setItem("sikap_user_email", customEmail);

    setTimeout(() => {
      if (role === "admin_ranting" || role === "verifikator") {
        router.push("/dashboard/admin");
      } else if (role === "koordinator_subranting") {
        router.push("/dashboard/koordinator");
      } else {
        router.push("/dashboard/anggota");
      }
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setErrorMessage("Silakan masukkan alamat email akun Anda.");
      return;
    }

    // Deteksi akun Admin Resmi iksmantup80@gmail.com
    const isAdminEmail =
      cleanEmail === "iksmantup80@gmail.com" ||
      cleanEmail.includes("admin") ||
      cleanEmail.includes("verif") ||
      cleanEmail.includes("iksmantup");

    if (isAdminEmail) {
      // Validasi password untuk akun admin iksmantup80@gmail.com
      if (cleanEmail === "iksmantup80@gmail.com" && password && password !== "1Jogodong!") {
        setErrorMessage("Kata sandi untuk admin iksmantup80@gmail.com salah. Kata sandi: 1Jogodong!");
        return;
      }
      handleLoginRole("admin_ranting", email.trim());
      return;
    }

    // Deteksi akun Koordinator Subranting
    if (cleanEmail.includes("koord") || selectedRole === "koordinator_subranting") {
      handleLoginRole("koordinator_subranting", email.trim());
      return;
    }

    // Pilihan role manual admin jika user memilih tab Admin Ranting
    if (selectedRole === "admin_ranting") {
      handleLoginRole("admin_ranting", email.trim());
      return;
    }

    // Default ke role Anggota Warga
    handleLoginRole("anggota", email.trim());
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-6 text-white text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-ikspi-mantup.png"
              alt="Logo IKSPI Kera Sakti Mantup"
              className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow-md"
            />
            <h2 className="text-xl font-black text-amber-100 tracking-tight">
              Portal Akses SIKAP Mantup
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto">
              Sistem Informasi Keanggotaan & Administrasi Persaudaraan IKSPI Kera Sakti Ranting Mantup
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Role Selection Tabs */}
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Pilih Peran Masuk:
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange("admin_ranting")}
                  className={`py-2 px-1 rounded-lg transition text-center ${
                    selectedRole === "admin_ranting"
                      ? "bg-amber-700 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  }`}
                >
                  <span className="block text-sm">👑</span>
                  <span className="text-[11px] block mt-0.5">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange("koordinator_subranting")}
                  className={`py-2 px-1 rounded-lg transition text-center ${
                    selectedRole === "koordinator_subranting"
                      ? "bg-amber-700 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  }`}
                >
                  <span className="block text-sm">📍</span>
                  <span className="text-[11px] block mt-0.5">Koordinator</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange("anggota")}
                  className={`py-2 px-1 rounded-lg transition text-center ${
                    selectedRole === "anggota"
                      ? "bg-amber-700 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  }`}
                >
                  <span className="block text-sm">👤</span>
                  <span className="text-[11px] block mt-0.5">Warga</span>
                </button>
              </div>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-fade-in flex items-start gap-2">
                <span className="text-sm">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Role Notice */}
            {selectedRole === "admin_ranting" && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <span>👑</span>
                  <span>Akun Administrator Ranting</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Memberikan akses penuh ke Database Master 15 Subranting Desa, Antrean Verifikasi KTA, dan Deteksi Duplikasi Anggota.
                </p>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Email Akun Terdaftar
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === "admin_ranting" ? "iksmantup80@gmail.com" : "email@anda.com"}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Kata Sandi
                  </label>
                  {selectedRole === "admin_ranting" && (
                    <span className="text-[10px] text-amber-800 font-mono">
                      (Sandi Admin: 1Jogodong!)
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Mengautentikasi...</span>
                  </>
                ) : (
                  <span>
                    Masuk sebagai {selectedRole === "admin_ranting" ? "Admin Ranting" : selectedRole === "koordinator_subranting" ? "Koordinator Desa" : "Warga"}
                  </span>
                )}
              </button>
            </form>

            {/* Quick 1-Click Fast Login Shortcut for Admin */}
            <div className="border-t border-stone-200 pt-4">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2 text-center">
                Akses Langsung Admin
              </span>
              <button
                type="button"
                onClick={() => handleLoginRole("admin_ranting", "iksmantup80@gmail.com")}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>👑</span>
                <span>Masuk Cepat Admin (iksmantup80@gmail.com)</span>
              </button>
            </div>

            <div className="text-center text-[11px] text-stone-500">
              Belum terdaftar sebagai anggota?{" "}
              <a href="/pendataan" className="text-amber-800 font-bold hover:underline">
                Isi Formulir Pendataan Mandiri →
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
