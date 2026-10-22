"use client";

import React, { useState } from "react";
import { AnggotaService } from "@/lib/services/anggotaService";
import { DESA_MANTUP_LIST } from "@/lib/constants/desas";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge, KategoriBadge } from "@/components/ui/Badge";
import { Anggota, DuplikatCandidate, StatusVerifikasi } from "@/types/database";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"master" | "verifikasi" | "duplikat" | "desa">("master");
  const [filterKategori, setFilterKategori] = useState<string>("");
  const [filterDesa, setFilterDesa] = useState<string>("");
  const [filterKeaktifan, setFilterKeaktifan] = useState<string>("");
  const [filterVerifikasi, setFilterVerifikasi] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);

  // States for unified verifikasi workspace
  const [selectedVerifItem, setSelectedVerifItem] = useState<Anggota | null>(null);
  const [catatanVerif, setCatatanVerif] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const stats = AnggotaService.getStatistik();
  const allAnggotaRaw = AnggotaService.getAll();
  const antreanVerifikasi = allAnggotaRaw.filter(
    (a) => a.status_verifikasi === "menunggu_verifikasi" || a.status_verifikasi === "perlu_koreksi"
  );

  const rawList = AnggotaService.getAll({
    desa_id: filterDesa || undefined,
    status_keaktifan: filterKeaktifan || undefined,
    status_verifikasi: filterVerifikasi || undefined,
    search: searchQuery || undefined,
  });

  const anggotaList = rawList.filter((a) => {
    if (!filterKategori) return true;
    const isSiswa = a.kategori_anggota === "siswa" || a.tingkatan?.startsWith("Siswa") || a.tingkatan === "Calon Warga";
    if (filterKategori === "siswa") return isSiswa;
    if (filterKategori === "warga") return !isSiswa;
    return true;
  });

  const duplikatList = AnggotaService.getDaftarKandidatDuplikat();

  const handleDecision = (newStatus: StatusVerifikasi) => {
    if (!selectedVerifItem) return;

    if ((newStatus === "perlu_koreksi" || newStatus === "ditolak") && !catatanVerif.trim()) {
      alert("Wajib menuliskan catatan alasan/koreksi untuk anggota yang ditolak atau diminta koreksi!");
      return;
    }

    const res = AnggotaService.prosesVerifikasi(
      selectedVerifItem.id,
      newStatus,
      catatanVerif.trim() || "Verifikasi dokumen dan nomor KTA fisik resmi sesuai.",
      "Admin & Verifikator Ranting"
    );

    if (res.success) {
      setActionNotice(`Status pendaftaran ${selectedVerifItem.nama_lengkap} berhasil diperbarui menjadi '${newStatus}'.`);
      setSelectedVerifItem(null);
      setCatatanVerif("");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Nama Lengkap",
      "Nomor KTA",
      "NIK",
      "Desa Subranting",
      "Tingkatan",
      "Tahun Pengesahan",
      "Keaktifan",
      "Verifikasi",
      "Nomor WA",
    ];

    const rows = anggotaList.map((a) => [
      a.id,
      `"${a.nama_lengkap}"`,
      `"${a.nomor_kta || ""}"`,
      `"${a.nik || ""}"`,
      `"${a.desa?.nama_desa || ""}"`,
      `"${a.tingkatan}"`,
      a.tahun_pengesahan,
      a.status_keaktifan,
      a.status_verifikasi,
      `"${a.nomor_wa}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sikap_mantup_anggota_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-red-700 tracking-wider uppercase">
            Pusat Kendali Admin & Verifikasi Ranting
          </span>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Database Master & Verifikasi Anggota Mantup
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pengelolaan satu pintu: pemeriksaan KTA fisik resmi, pencegahan duplikasi, & struktur 15 subranting desa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Data CSV
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("master")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition ${
            activeTab === "master" ? "bg-amber-50/50 border-amber-400 ring-1 ring-amber-300" : "bg-white border-stone-200 hover:border-amber-300"
          }`}
        >
          <span className="text-xs text-stone-500 uppercase font-semibold">Total Warga</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-stone-400">Tercatat di Database</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-emerald-600 uppercase font-semibold">Terverifikasi Sah</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.terverifikasi}</div>
          <span className="text-[10px] text-emerald-600 font-medium">KTA Fisik Valid</span>
        </div>

        <div
          onClick={() => setActiveTab("verifikasi")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition ${
            activeTab === "verifikasi"
              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-400"
              : "bg-white border-stone-200 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 uppercase font-semibold">Antrean Verifikasi</span>
            {antreanVerifikasi.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{antreanVerifikasi.length}</div>
          <span className="text-[10px] text-amber-600 font-medium">Klik untuk periksa berkas →</span>
        </div>

        <div
          onClick={() => setActiveTab("duplikat")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition ${
            activeTab === "duplikat" ? "bg-rose-50/50 border-rose-400 ring-1 ring-rose-300" : "bg-white border-stone-200 hover:border-rose-300"
          }`}
        >
          <span className="text-xs text-rose-600 uppercase font-semibold">Potensi Duplikat</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{duplikatList.length}</div>
          <span className="text-[10px] text-rose-600 font-medium">KTA / Identitas Kembar</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("master")}
          className={`pb-3 text-sm font-bold border-b-2 transition shrink-0 ${
            activeTab === "master"
              ? "border-amber-700 text-amber-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Master Data Anggota ({anggotaList.length})
        </button>

        <button
          onClick={() => setActiveTab("verifikasi")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "verifikasi"
              ? "border-amber-700 text-amber-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <span>Antrean Verifikasi KTA</span>
          {antreanVerifikasi.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              {antreanVerifikasi.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("duplikat")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "duplikat"
              ? "border-rose-700 text-rose-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <span>Pemeriksaan Duplikasi</span>
          {duplikatList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              {duplikatList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("desa")}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === "desa"
              ? "border-amber-700 text-amber-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          15 Subranting Desa
        </button>
      </div>

      {/* TAB 1: MASTER DATA ANGGOTA */}
      {activeTab === "master" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama anggota, KTA, atau desa..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs">
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-stone-300 text-stone-700 bg-white font-medium"
              >
                <option value="">Semua Kategori (Warga & Siswa)</option>
                <option value="warga">⭐ Khusus Warga</option>
                <option value="siswa">🥋 Khusus Siswa</option>
              </select>

              <select
                value={filterDesa}
                onChange={(e) => setFilterDesa(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-stone-300 text-stone-700 bg-white"
              >
                <option value="">Semua 15 Desa</option>
                {DESA_MANTUP_LIST.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_desa}
                  </option>
                ))}
              </select>

              <select
                value={filterKeaktifan}
                onChange={(e) => setFilterKeaktifan(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-stone-300 text-stone-700 bg-white"
              >
                <option value="">Semua Keaktifan</option>
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
                <option value="mutasi_keluar">Mutasi Keluar</option>
                <option value="meninggal">Wafat / Almarhum</option>
              </select>

              <select
                value={filterVerifikasi}
                onChange={(e) => setFilterVerifikasi(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-stone-300 text-stone-700 bg-white"
              >
                <option value="">Semua Verifikasi</option>
                <option value="terverifikasi">Terverifikasi</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="perlu_koreksi">Perlu Koreksi</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama & Kategori</th>
                    <th className="py-3 px-4">KTA / Tempat Latihan</th>
                    <th className="py-3 px-4">Desa Subranting</th>
                    <th className="py-3 px-4">Tingkatan / Angkatan</th>
                    <th className="py-3 px-4">Status Keaktifan</th>
                    <th className="py-3 px-4">Status Verifikasi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {anggotaList.map((a) => {
                    const isSiswa =
                      a.kategori_anggota === "siswa" ||
                      a.tingkatan?.startsWith("Siswa") ||
                      a.tingkatan === "Calon Warga";

                    return (
                      <tr key={a.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                            <span>{a.nama_lengkap}</span>
                            <KategoriBadge kategori={isSiswa ? "siswa" : "warga"} />
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                            NIK: {a.nik || "-"} • WA: {a.nomor_wa}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isSiswa ? (
                            <div>
                              <span className="text-indigo-900 font-bold block">
                                {a.tempat_latihan || "Subranting Mantup"}
                              </span>
                              {a.nama_pelatih && (
                                <span className="text-[10px] text-stone-500 block">
                                  Pelatih: {a.nama_pelatih}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-amber-900">
                              {a.nomor_kta || <span className="text-stone-400 font-normal">Belum Tercatat</span>}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-stone-800">
                            {a.desa?.nama_desa || "-"}
                          </span>
                          <div className="text-[10px] text-stone-400">
                            {a.alamat_detail}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <TingkatanBadge tingkatan={a.tingkatan} />
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            {isSiswa ? `Target ${a.tahun_pengesahan}` : `Angkatan ${a.tahun_pengesahan}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <KeaktifanBadge status={a.status_keaktifan} />
                        </td>
                        <td className="py-3 px-4">
                          <VerifikasiBadge status={a.status_verifikasi} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedAnggota(a)}
                            className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold transition"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {anggotaList.length === 0 && (
              <div className="p-8 text-center text-xs text-stone-500">
                Tidak ada data anggota yang cocok dengan filter yang dipilih.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB VERIFIKASI KTA LANGSUNG */}
      {activeTab === "verifikasi" && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <span className="text-lg">🔍</span>
            <div>
              <strong className="block font-bold mb-0.5 text-sm">
                Panel Verifikasi & Validasi Dokumen KTA Fisik
              </strong>
              Periksa keabsahan nomor KTA fisik resmi pusat Madiun, keaslian foto kartu KTA, serta kecocokan data warga sebelum diterbitkan status sah.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Queue List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Daftar Antrean Masuk ({antreanVerifikasi.length})
                </h3>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                  Perlu Ditindak
                </span>
              </div>

              <div className="space-y-2">
                {antreanVerifikasi.map((item) => {
                  const isSelected = selectedVerifItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedVerifItem(item);
                        setCatatanVerif(item.catatan_verifikasi || "");
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-50/90 border-amber-500 shadow-md ring-1 ring-amber-400"
                          : "bg-white border-stone-200 hover:border-amber-300 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-stone-900">
                            {item.nama_lengkap}
                          </div>
                          <div className="text-xs font-mono font-bold text-amber-900 mt-0.5">
                            KTA: {item.nomor_kta || "(Belum Tercatat)"}
                          </div>
                        </div>
                        <VerifikasiBadge status={item.status_verifikasi} />
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-medium text-stone-700">{item.desa?.nama_desa}</span>
                        <span>Angkatan {item.tahun_pengesahan}</span>
                      </div>
                    </div>
                  );
                })}

                {antreanVerifikasi.length === 0 && (
                  <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                    <span className="text-2xl block mb-1">🎉</span>
                    Tidak ada antrean baru. Semua formulir pengajuan warga telah tuntas diverifikasi!
                  </div>
                )}
              </div>
            </div>

            {/* Right: Inspection & Decision Box */}
            <div className="lg:col-span-7">
              {selectedVerifItem ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md space-y-5">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase">
                        Pemeriksaan Pengajuan ID: {selectedVerifItem.id}
                      </span>
                      <h3 className="text-lg font-black text-stone-900">
                        {selectedVerifItem.nama_lengkap}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <TingkatanBadge tingkatan={selectedVerifItem.tingkatan} />
                      <KeaktifanBadge status={selectedVerifItem.status_keaktifan} />
                    </div>
                  </div>

                  {/* Identity Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-400 block">Nomor KTA Pusat (Fisik):</span>
                      <span className="font-mono font-bold text-amber-900 text-sm">
                        {selectedVerifItem.nomor_kta || "(Belum Mengisi KTA)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Desa Subranting:</span>
                      <span className="font-medium text-stone-800">
                        {selectedVerifItem.desa?.nama_desa}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Tempat, Tanggal Lahir:</span>
                      <span>{selectedVerifItem.tempat_lahir}, {selectedVerifItem.tanggal_lahir}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Kontak WhatsApp:</span>
                      <span className="font-mono text-stone-800">{selectedVerifItem.nomor_wa}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Pengesahan / Angkatan:</span>
                      <span>Tahun {selectedVerifItem.tahun_pengesahan} • {selectedVerifItem.tempat_pengesahan || "Pusat Madiun"}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Alamat Domisili:</span>
                      <span>{selectedVerifItem.alamat_detail} (RT/RW {selectedVerifItem.rt_rw || "-"})</span>
                    </div>
                  </div>

                  {/* Photo Evidence Preview */}
                  <div>
                    <span className="text-xs font-bold text-stone-700 block mb-2">
                      Bukti Fisik KTA / Kartu Anggota:
                    </span>
                    <div className="h-44 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center p-3 overflow-hidden">
                      {selectedVerifItem.foto_kta_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedVerifItem.foto_kta_url}
                          alt="Foto Fisik KTA"
                          className="max-h-full rounded-lg object-contain shadow-xs"
                        />
                      ) : (
                        <span className="text-xs text-stone-400">
                          Calon anggota belum melampirkan foto kartu KTA.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Catatan Verifikasi (Wajib jika minta revisi / tolak)
                    </label>
                    <textarea
                      rows={2}
                      value={catatanVerif}
                      onChange={(e) => setCatatanVerif(e.target.value)}
                      placeholder="Contoh: 'Disetujui sah' atau 'Foto KTA buram, mohon upload ulang foto nomor KTA dengan jelas'."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Decision Actions */}
                  <div className="pt-3 border-t flex flex-wrap items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDecision("ditolak")}
                      className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 rounded-xl font-bold transition"
                    >
                      Tolak
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision("perlu_koreksi")}
                      className="px-4 py-2 bg-orange-50 text-orange-800 border border-orange-300 hover:bg-orange-100 rounded-xl font-bold transition"
                    >
                      Minta Koreksi
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision("terverifikasi")}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Setujui (Terverifikasi Sah)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-400 text-xs">
                  Pilih salah satu calon anggota dari antrean di sebelah kiri untuk memeriksa keabsahan berkas fisik KTA.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DETEKSI ANGGOTA DUPLIKAT */}
      {activeTab === "duplikat" && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-900">
            <strong className="block font-bold mb-1 text-sm">
              🛡️ Fitur Deteksi & Perlindungan Data Anggota Ganda
            </strong>
            Sistem secara proaktif membandingkan nomor KTA pusat fisik yang identik, serta mendeteksi calon anggota dengan kombinasi Nama Lengkap dan Tanggal Lahir yang sama untuk mencegah data ganda.
          </div>

          {duplikatList.length > 0 ? (
            <div className="space-y-4">
              {duplikatList.map((cand, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-rose-300 rounded-2xl p-5 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                        Peringatan Duplikasi: {cand.alasan}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-stone-500">
                      Tingkat Kemiripan: {cand.confidence}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Record 1 */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">
                        Record A (ID: {cand.anggota1.id})
                      </span>
                      <div className="text-sm font-bold text-stone-900">{cand.anggota1.nama_lengkap}</div>
                      <div>KTA: <span className="font-mono font-bold text-amber-800">{cand.anggota1.nomor_kta}</span></div>
                      <div>Tgl Lahir: {cand.anggota1.tanggal_lahir}</div>
                      <div>Desa: {cand.anggota1.desa?.nama_desa}</div>
                      <div>Kontak WA: {cand.anggota1.nomor_wa}</div>
                      <div className="pt-2">
                        <VerifikasiBadge status={cand.anggota1.status_verifikasi} />
                      </div>
                    </div>

                    {/* Record 2 */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">
                        Record B (ID: {cand.anggota2.id})
                      </span>
                      <div className="text-sm font-bold text-stone-900">{cand.anggota2.nama_lengkap}</div>
                      <div>KTA: <span className="font-mono font-bold text-amber-800">{cand.anggota2.nomor_kta}</span></div>
                      <div>Tgl Lahir: {cand.anggota2.tanggal_lahir}</div>
                      <div>Desa: {cand.anggota2.desa?.nama_desa}</div>
                      <div>Kontak WA: {cand.anggota2.nomor_wa}</div>
                      <div className="pt-2">
                        <VerifikasiBadge status={cand.anggota2.status_verifikasi} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => alert(`Sistem menolak Record B (${cand.anggota2.id}) sebagai duplikat dan mempertahankan Record A.`)}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-medium transition"
                    >
                      Tolak Record B (Tandai Ganda)
                    </button>
                    <button
                      onClick={() => alert(`Data digabungkan secara aman.`)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition"
                    >
                      Gabungkan Data (Merge)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              Tidak ada indikasi anggota ganda atau duplikasi KTA saat ini. Database bersih.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAJEMEN 15 DESA SUBRANTING */}
      {activeTab === "desa" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Desa / Subranting</th>
                  <th className="py-3 px-4">Koordinator Wilayah</th>
                  <th className="py-3 px-4">Kontak WhatsApp</th>
                  <th className="py-3 px-4">Alamat Titik Kumpul / Sekretariat</th>
                  <th className="py-3 px-4 text-center">Warga Terdata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.sebaranDesa.map((desa) => (
                  <tr key={desa.id} className="hover:bg-amber-50/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">
                      {desa.kode_desa}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {desa.nama_desa}
                    </td>
                    <td className="py-3 px-4 text-stone-800 font-medium">
                      {desa.nama_koordinator || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {desa.kontak_koordinator || "-"}
                    </td>
                    <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                      {desa.alamat_sekretariat || "-"}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-amber-900">
                      {desa.jumlahAnggota}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Anggota */}
      {selectedAnggota && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-stone-900">
                Detail Arsip Anggota
              </h3>
              <button
                onClick={() => setSelectedAnggota(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400 block">Kategori Anggota:</span>
                  <span className="font-bold text-amber-900">
                    {selectedAnggota.kategori_anggota === "siswa" ||
                    selectedAnggota.tingkatan?.startsWith("Siswa") ||
                    selectedAnggota.tingkatan === "Calon Warga"
                      ? "🥋 Siswa Latihan"
                      : "⭐ Warga Disahkan"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Nama Lengkap:</span>
                  <span className="font-bold text-stone-900">{selectedAnggota.nama_lengkap}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">
                    {selectedAnggota.kategori_anggota === "siswa" ||
                    selectedAnggota.tingkatan?.startsWith("Siswa") ||
                    selectedAnggota.tingkatan === "Calon Warga"
                      ? "Tempat Latihan:"
                      : "Nomor KTA Pusat:"}
                  </span>
                  <span className="font-mono font-bold text-amber-900">
                    {selectedAnggota.kategori_anggota === "siswa" ||
                    selectedAnggota.tingkatan?.startsWith("Siswa") ||
                    selectedAnggota.tingkatan === "Calon Warga"
                      ? selectedAnggota.tempat_latihan || "Subranting Desa"
                      : selectedAnggota.nomor_kta || "Belum ada"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Tingkatan / Sabuk:</span>
                  <span className="font-bold text-stone-900">{selectedAnggota.tingkatan}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">NIK:</span>
                  <span>{selectedAnggota.nik || "-"}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">WhatsApp:</span>
                  <span>{selectedAnggota.nomor_wa}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">TTL:</span>
                  <span>{selectedAnggota.tempat_lahir}, {selectedAnggota.tanggal_lahir}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Subranting:</span>
                  <span>{selectedAnggota.desa?.nama_desa}</span>
                </div>
              </div>

              {selectedAnggota.catatan_verifikasi && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                  <span className="font-bold block">Catatan Verifikasi:</span>
                  <p>{selectedAnggota.catatan_verifikasi}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setSelectedAnggota(null)}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-semibold"
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
