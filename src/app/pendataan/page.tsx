"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FormPendataan } from "@/components/forms/FormPendataan";

function PendataanContent() {
  const searchParams = useSearchParams();
  const defaultDesa = searchParams.get("desa") || undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs font-bold text-amber-800 tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
          Pendataan Mandiri Anggota
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 mt-3">
          Pendaftaran & Pemutakhiran Data Warga
        </h1>
        <p className="text-sm text-stone-600 mt-2">
          IKSPI Kera Sakti Ranting Mantup, Kec. Mantup, Kab. Lamongan. Silakan siapkan informasi fisik KTA atau ijazah warga Anda.
        </p>
      </div>

      <FormPendataan defaultDesaId={defaultDesa} />
    </div>
  );
}

export default function PendataanPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100/70 font-sans">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Memuat formulir...</div>}>
          <PendataanContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
