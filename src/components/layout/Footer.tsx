import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-ikspi-mantup.png"
                alt="Logo IKSPI Kera Sakti Mantup"
                className="w-9 h-9 object-contain"
              />
              <span className="text-white font-extrabold text-lg tracking-tight">
                SIKAP MANTUP
              </span>
            </div>
            <p className="text-sm text-stone-400 mb-4 max-w-md">
              Sistem Informasi Keanggotaan dan Administrasi Perguruan untuk internal
              IKSPI Kera Sakti Ranting Mantup, Kecamatan Mantup, Kabupaten Lamongan, Jawa Timur.
            </p>
            <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700 text-xs text-stone-300">
              <strong className="text-amber-400">Catatan Privasi & Keabsahan:</strong> Data anggota dilindungi sesuai etika perguruan dan peraturan perlindungan data pribadi. Tidak ada nomor KTA buatan mandiri; seluruh pencatatan merujuk pada KTA fisik resmi dari Pusat.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Layanan Warga
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pendataan" className="hover:text-amber-400 transition">
                  Formulir Pendataan Mandiri
                </Link>
              </li>
              <li>
                <Link href="/cek-tiket" className="hover:text-amber-400 transition">
                  Cek Status Pengajuan (Tiket)
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-amber-400 transition">
                  Portal Koordinator & Verifikator
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-amber-400 transition">
                  Pertanyaan Umum (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Subranting Wilayah Mantup */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Wilayah Kerja (15 Desa)
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              Mantup, Sukobendu, Kedungsumber, Sumberkerep, Mojosari, Kedukbembem, Tunggunjagir, Plabuhan, Rumpuk, Tugu, Sukosongo, Sumberagung, Sumberdadi, Sidomulyo, Kutorejo.
            </p>
            <p className="text-xs text-amber-500 font-medium">
              Sekretariat Ranting Mantup, Kec. Mantup, Kab. Lamongan
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 gap-4">
          <p>© 2026 SIKAP Mantup • Pengurus IKSPI Kera Sakti Ranting Mantup.</p>
          <p className="flex items-center gap-2">
            <span>Dikelola Internal</span> • <span>Non-Official API Central</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
