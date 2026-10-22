"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Pendataan Mandiri", href: "/pendataan" },
    { name: "Cek Status Tiket", href: "/cek-tiket" },
    { name: "Wilayah 15 Desa", href: "/#subranting" },
    { name: "Portal Pengurus / Login", href: "/auth/login" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-amber-200/60 shadow-xs">
      {/* Top Banner Non-Official Organization Disclaimer */}
      <div className="bg-amber-900 text-amber-100 text-xs px-4 py-1.5 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>
          Sistem Administrasi Internal <strong>IKSPI Kera Sakti Ranting Mantup, Lamongan</strong> — Bukan aplikasi resmi Pusat Madiun
        </span>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-ikspi-mantup.png"
              alt="Logo IKSPI Kera Sakti Mantup"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 text-lg tracking-tight">
                  SIKAP MANTUP
                </span>
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  IKSPI
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Kecamatan Mantup • Kab. Lamongan
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isLogin = link.href === "/auth/login";

              if (isLogin) {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="ml-2 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-red-700 hover:from-amber-800 hover:to-red-800 transition"
                  >
                    Portal Pengurus
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? "text-red-700 bg-red-50 font-semibold"
                      : "text-gray-700 hover:text-red-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-red-700 hover:bg-gray-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? "text-red-700 bg-red-50 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
