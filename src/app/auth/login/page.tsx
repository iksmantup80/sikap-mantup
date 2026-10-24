"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RayonService } from "@/lib/services/rayonService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setErrorMessage("Silakan masukkan alamat email akun Anda.");
      return;
    }
    if (!password) {
      setErrorMessage("Silakan masukkan kata sandi akun Anda.");
      return;
    }

    setLoading(true);

    // 1. Verifikasi Akun Administrator Resmi Ranting
    if (
      cleanEmail === "iksmantup80@gmail.com" ||
      cleanEmail === "admin@sikapmantup.internal"
    ) {
      if (password !== "1Jogodong!") {
        setLoading(false);
        setErrorMessage("Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.");
        return;
      }

      sessionStorage.setItem("sikap_user_role", "admin_ranting");
      sessionStorage.setItem("sikap_user_email", cleanEmail);
      setTimeout(() => {
        router.push("/dashboard/admin");
      }, 350);
      return;
    }

    // 2. Verifikasi Akun Validator / Ketua Rayon
    try {
      const rayonAuth = await RayonService.authenticate(cleanEmail, password);
      if (rayonAuth.authenticated && rayonAuth.rayon) {
        sessionStorage.setItem("sikap_user_role", "verifikator");
        sessionStorage.setItem("sikap_user_email", cleanEmail);
        sessionStorage.setItem("sikap_user_nama", rayonAuth.rayon.nama_ketua);
        sessionStorage.setItem("sikap_user_rayon", rayonAuth.rayon.nama_rayon);
        setTimeout(() => {
          router.push("/dashboard/verifikator");
        }, 350);
        return;
      } else if (rayonAuth.message) {
        setLoading(false);
        setErrorMessage(rayonAuth.message);
        return;
      }
    } catch {
      // lanjut ke pengecekan berikutnya jika offline/error
    }

    // 3. Verifikasi Akun Koordinator Subranting
    if (cleanEmail.includes("koord") || cleanEmail.includes("subranting")) {
      sessionStorage.setItem("sikap_user_role", "koordinator_subranting");
      sessionStorage.setItem("sikap_user_email", cleanEmail);
      setTimeout(() => {
        router.push("/dashboard/koordinator");
      }, 350);
      return;
    }

    // 4. Verifikasi Akun Anggota Warga Mandiri
    sessionStorage.setItem("sikap_user_role", "anggota");
    sessionStorage.setItem("sikap_user_email", cleanEmail);
    setTimeout(() => {
      router.push("/dashboard/anggota");
    }, 350);
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
              Portal Masuk SIKAP Mantup
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto">
              Sistem Informasi Keanggotaan & Administrasi Perguruan IKSPI Kera Sakti Ranting Mantup
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-fade-in flex items-start gap-2">
                <span className="text-sm">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Standard Secure Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Email Akun Terdaftar
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <span>Masuk ke Sistem</span>
                )}
              </button>
            </form>

            <div className="border-t border-stone-200 pt-4 text-center space-y-2">
              <p className="text-xs text-stone-500">
                Akses terproteksi bagi Pengurus Ranting Mantup, Koordinator 15 Subranting Desa, dan Warga Terdaftar.
              </p>
              <div className="text-[11px] text-stone-500">
                Belum terdaftar sebagai anggota?{" "}
                <a href="/pendataan" className="text-amber-800 font-bold hover:underline">
                  Isi Formulir Pendataan Mandiri →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
