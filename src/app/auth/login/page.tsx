"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UserRole } from "@/types/database";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginRole = (role: UserRole, customEmail?: string) => {
    setLoading(true);
    // In demo / client-side workflow: set active role in sessionStorage and navigate
    sessionStorage.setItem("sikap_user_role", role);
    sessionStorage.setItem("sikap_user_email", customEmail || `${role}@sikapmantup.internal`);

    setTimeout(() => {
      if (role === "anggota") {
        router.push("/dashboard/anggota");
      } else if (role === "koordinator_subranting") {
        router.push("/dashboard/koordinator");
      } else if (role === "verifikator") {
        router.push("/dashboard/verifikator");
      } else {
        router.push("/dashboard/admin");
      }
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (email.includes("admin") || email.includes("verif")) {
      handleLoginRole("admin_ranting", email);
    } else if (email.includes("koord")) {
      handleLoginRole("koordinator_subranting", email);
    } else {
      handleLoginRole("anggota", email);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 to-amber-950 p-6 text-white text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-ikspi-mantup.png"
              alt="Logo IKSPI Kera Sakti Mantup"
              className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow-md"
            />
            <h2 className="text-xl font-black text-amber-100">
              Portal SIKAP Mantup
            </h2>
            <p className="text-xs text-stone-300 mt-1">
              Akses khusus Admin/Verifikator Ranting, Koordinator Desa (15 Subranting), & Warga
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
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
                  placeholder="admin@sikapmantup.internal"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? "Memproses Autentikasi..." : "Masuk ke Sistem"}
              </button>
            </form>

            <div className="border-t border-stone-200 pt-4 text-center">
              <p className="text-xs text-stone-500">
                Belum memiliki akun login? Akun pengguna hanya diaktifkan oleh Admin setelah pengajuan formulir dinyatakan <strong>Terverifikasi Sah</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
