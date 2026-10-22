"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRole } from "@/types/database";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("admin_ranting");
  const [email, setEmail] = useState<string>("admin@sikapmantup.internal");

  useEffect(() => {
    const storedRole = sessionStorage.getItem("sikap_user_role") as UserRole;
    const storedEmail = sessionStorage.getItem("sikap_user_email") || "";
    if (storedEmail) setEmail(storedEmail);

    // Otomatis aktifkan peran Admin Ranting jika akun adalah iksmantup80@gmail.com
    if (
      storedEmail.toLowerCase().includes("iksmantup") ||
      storedEmail.toLowerCase().includes("admin") ||
      storedEmail.toLowerCase().includes("verif")
    ) {
      if (!storedRole || storedRole === "anggota") {
        setRole("admin_ranting");
        sessionStorage.setItem("sikap_user_role", "admin_ranting");
        return;
      }
    }

    if (storedRole) setRole(storedRole);
  }, [pathname]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    sessionStorage.setItem("sikap_user_role", newRole);
    if (newRole === "admin_ranting") router.push("/dashboard/admin");
    else if (newRole === "verifikator") router.push("/dashboard/verifikator");
    else if (newRole === "koordinator_subranting") router.push("/dashboard/koordinator");
    else router.push("/dashboard/anggota");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sikap_user_role");
    sessionStorage.removeItem("sikap_user_email");
    router.push("/");
  };

  const isAdminUser =
    role === "admin_ranting" ||
    role === "verifikator" ||
    email.toLowerCase().includes("iksmantup") ||
    email.toLowerCase().includes("admin");

  const navItems = [
    {
      name: "Pusat Kendali & Verifikasi Ranting",
      href: "/dashboard/admin",
      roles: ["admin_ranting", "verifikator"],
      icon: "⚙️",
    },
    {
      name: "Wilayah Koordinator Desa",
      href: "/dashboard/koordinator",
      roles: ["admin_ranting", "koordinator_subranting"],
      icon: "📍",
    },
    {
      name: "Profil & KTA Anggota",
      href: "/dashboard/anggota",
      roles: ["admin_ranting", "anggota"],
      icon: "👤",
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    isAdminUser ? true : item.roles.includes(role)
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top App Header */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-ikspi-mantup.png"
                alt="Logo IKSPI Kera Sakti Mantup"
                className="w-9 h-9 object-contain"
              />
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  SIKAP MANTUP
                </span>
                <span className="text-[10px] text-amber-400 font-medium block">
                  Sistem Administrasi Ranting
                </span>
              </div>
            </Link>
          </div>

          {/* Role Switcher & User Profile Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-800 px-2 sm:px-3 py-1.5 rounded-lg border border-stone-700 text-xs">
              <span className="text-stone-400 hidden xs:inline">Peran:</span>
              <select
                value={role === "verifikator" ? "admin_ranting" : role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-stone-900 text-amber-300 font-bold rounded px-1.5 py-0.5 border border-stone-600 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="admin_ranting">👑 Admin Ranting</option>
                <option value="koordinator_subranting">📍 Koordinator Desa</option>
                <option value="anggota">👤 Anggota Warga</option>
              </select>
            </div>

            <div className="text-right hidden md:block">
              <span className="text-xs font-semibold text-stone-200 block truncate max-w-[150px]">
                {email}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block">
                {isAdminUser ? "👑 Admin Ranting" : "Akun Terverifikasi"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs bg-red-800/80 hover:bg-red-700 text-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-700 transition"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Dashboard Subnav */}
        <div className="bg-stone-850 border-t border-stone-800 px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center space-x-2 py-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                      isActive
                        ? "bg-amber-600 text-white font-bold"
                        : "text-stone-300 hover:text-white hover:bg-stone-800"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
