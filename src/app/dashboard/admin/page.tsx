"use client";

import React, { useState } from "react";
import { AnggotaService } from "@/lib/services/anggotaService";
import { RayonService } from "@/lib/services/rayonService";
import { DESA_MANTUP_LIST } from "@/lib/constants/desas";
import { VerifikasiBadge, KeaktifanBadge, TingkatanBadge, KategoriBadge } from "@/components/ui/Badge";
import { Anggota, DuplikatCandidate, StatusVerifikasi, Rayon } from "@/types/database";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"master" | "verifikasi" | "duplikat" | "desa" | "rayon">("master");
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
  const [dataList, setDataList] = useState<Anggota[]>(() => AnggotaService.getAll());
  const [rayonList, setRayonList] = useState<Rayon[]>(() => RayonService.getAll());
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Rayon & Validator Account Management States
  const [showAddRayonModal, setShowAddRayonModal] = useState(false);
  const [rayonSuccessMsg, setRayonSuccessMsg] = useState<string | null>(null);
  const [isSavingRayon, setIsSavingRayon] = useState(false);
  const [namaRayonInput, setNamaRayonInput] = useState("");
  const [desaRayonInput, setDesaRayonInput] = useState(DESA_MANTUP_LIST[0].id);
  const [namaKetuaInput, setNamaKetuaInput] = useState("");
  const [waKetuaInput, setWaKetuaInput] = useState("");
  const [alamatRayonInput, setAlamatRayonInput] = useState("");
  const [emailRayonInput, setEmailRayonInput] = useState("");
  const [passRayonInput, setPassRayonInput] = useState("IKSPI_Rayon2026!");

  const reloadData = async () => {
    setLoading(true);
    try {
      const [data, rayons] = await Promise.all([
        AnggotaService.getAllAsync(),
        RayonService.getAllAsync(),
      ]);
      setDataList(data);
      setRayonList(rayons);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    reloadData();
  }, []);

  const stats = AnggotaService.getStatistik();
  const allAnggotaRaw = dataList;
  const antreanVerifikasi = allAnggotaRaw.filter(
    (a) => a.status_verifikasi === "menunggu_verifikasi" || a.status_verifikasi === "perlu_koreksi"
  );

  const rawList = allAnggotaRaw.filter((item) => {
    if (filterDesa && item.desa_id !== filterDesa) return false;
    if (filterKeaktifan && item.status_keaktifan !== filterKeaktifan) return false;
    if (filterVerifikasi && item.status_verifikasi !== filterVerifikasi) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.nama_lengkap.toLowerCase().includes(q);
      const matchKta = item.nomor_kta?.toLowerCase().includes(q);
      const matchDesa = item.desa?.nama_desa.toLowerCase().includes(q);
      const matchRayon = item.tempat_latihan?.toLowerCase().includes(q);
      if (!matchName && !matchKta && !matchDesa && !matchRayon) return false;
    }
    return true;
  });

  const anggotaList = rawList.filter((a) => {
    if (!filterKategori) return true;
    const isSiswa = a.kategori_anggota === "siswa" || a.tingkatan?.startsWith("Siswa") || a.tingkatan === "Calon Warga";
    if (filterKategori === "siswa") return isSiswa;
    if (filterKategori === "warga") return !isSiswa;
    return true;
  });

  const duplikatList = AnggotaService.getDaftarKandidatDuplikat();

  const handleDecision = async (newStatus: StatusVerifikasi) => {
    if (!selectedVerifItem) return;

    if ((newStatus === "perlu_koreksi" || newStatus === "ditolak") && !catatanVerif.trim()) {
      alert("Wajib menuliskan catatan alasan/koreksi untuk anggota yang ditolak atau diminta koreksi!");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await AnggotaService.prosesVerifikasiAsync(
        selectedVerifItem.id,
        newStatus,
        catatanVerif.trim() || "Verifikasi dokumen dan nomor KTA fisik resmi sesuai.",
        "Admin & Verifikator Ranting"
      );

      if (res.success) {
        setActionNotice(`Status pendaftaran ${selectedVerifItem.nama_lengkap} berhasil diperbarui menjadi '${newStatus}'.`);
        setSelectedVerifItem(null);
        setCatatanVerif("");
        await reloadData();
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setIsProcessing(false);
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
            onClick={reloadData}
            disabled={loading}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 border border-stone-300"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-700" : "text-stone-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? "Menyinkronkan..." : "Sinkronkan Cloud"}</span>
          </button>

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

        <button
          onClick={() => setActiveTab("rayon")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "rayon"
              ? "border-amber-700 text-amber-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <span>Kelola Rayon & Validator</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
            {rayonList.length}
          </span>
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
                          {a.tempat_latihan && (
                            <span className="text-[11px] text-amber-900 font-semibold block">
                              Rayon: {a.tempat_latihan}
                            </span>
                          )}
                          <div className="text-[10px] text-stone-400">
                            {a.alamat_detail}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <TingkatanBadge tingkatan={a.tingkatan} />
                          <div className="text-[11px] mt-1">
                            {isSiswa ? (
                              <span className="text-indigo-800 font-medium">Target {a.tahun_pengesahan}</span>
                            ) : (
                              <div>
                                {a.angkatan && (
                                  <span className="font-bold text-amber-950 block">
                                    Angkatan {a.angkatan}
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-500 block">
                                  {a.tanggal_pengesahan ? `Disahkan: ${a.tanggal_pengesahan}` : `Disahkan Th. ${a.tahun_pengesahan}`}
                                </span>
                              </div>
                            )}
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
                        setTimeout(() => {
                          document.getElementById("inspection-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
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
                        <span className="font-semibold text-amber-950">
                          {item.angkatan ? `Angkatan ${item.angkatan}` : ""}
                          {item.tahun_pengesahan ? ` • Th. ${item.tahun_pengesahan}` : ""}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-2 pt-1.5 border-t border-amber-200 text-[10px] text-amber-800 font-bold block lg:hidden">
                          👉 Berkas aktif dibuka di bawah ↓
                        </div>
                      )}
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
            <div id="inspection-box" className="lg:col-span-7 scroll-mt-24">
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
                      <span className="text-stone-400 block">No. Induk (KTA Pusat):</span>
                      <span className="font-mono font-bold text-amber-900 text-sm">
                        {selectedVerifItem.nomor_kta || "(Belum Mengisi No. Induk)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Angkatan & Pengesahan:</span>
                      <span className="font-semibold text-stone-800">
                        {selectedVerifItem.angkatan ? `Angkatan ${selectedVerifItem.angkatan}` : ""}
                        {selectedVerifItem.tanggal_pengesahan
                          ? ` • Disahkan: ${selectedVerifItem.tanggal_pengesahan}`
                          : selectedVerifItem.tahun_pengesahan
                          ? ` • Th. ${selectedVerifItem.tahun_pengesahan}`
                          : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Desa Subranting:</span>
                      <span className="font-medium text-stone-800">
                        {selectedVerifItem.desa?.nama_desa}
                      </span>
                    </div>
                    {selectedVerifItem.tempat_latihan && (
                      <div>
                        <span className="text-stone-400 block">Rayon / Tempat Latihan:</span>
                        <strong className="text-amber-900 font-bold">
                          {selectedVerifItem.tempat_latihan}
                        </strong>
                      </div>
                    )}
                    <div>
                      <span className="text-stone-400 block">Tempat, Tanggal Lahir:</span>
                      <span>{selectedVerifItem.tempat_lahir}, {selectedVerifItem.tanggal_lahir}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Kontak WhatsApp:</span>
                      <span className="font-mono text-stone-800">{selectedVerifItem.nomor_wa}</span>
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
                      disabled={isProcessing}
                      onClick={() => handleDecision("ditolak")}
                      className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 disabled:opacity-50 rounded-xl font-bold transition"
                    >
                      {isProcessing ? "Menyimpan..." : "Tolak"}
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecision("perlu_koreksi")}
                      className="px-4 py-2 bg-orange-50 text-orange-800 border border-orange-300 hover:bg-orange-100 disabled:opacity-50 rounded-xl font-bold transition"
                    >
                      {isProcessing ? "Menyimpan..." : "Minta Koreksi"}
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecision("terverifikasi")}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>{isProcessing ? "Menyimpan ke Cloud..." : "Setujui (Terverifikasi Sah)"}</span>
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

      {/* TAB 5: KELOLA RAYON & AKUN VALIDATOR */}
      {activeTab === "rayon" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
                Struktur Latihan & Tim Validator Rayon
              </span>
              <h2 className="text-xl font-black text-stone-900 mt-0.5">
                Kelola Rayon & Akun Validator
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Daftarkan titik latihan (Rayon), tunjuk Ketua Rayon, dan buatkan akun login resmi sebagai Pembantu Validator berkas fisik KTA / siswa.
              </p>
            </div>
            <button
              onClick={() => setShowAddRayonModal(true)}
              className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <span>+</span>
              <span>Daftarkan Rayon & Buat Akun</span>
            </button>
          </div>

          {rayonSuccessMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 animate-fade-in flex items-center justify-between">
              <span>{rayonSuccessMsg}</span>
              <button onClick={() => setRayonSuccessMsg(null)} className="text-emerald-700 font-bold ml-2">✕</button>
            </div>
          )}

          {/* List of Rayons */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama Rayon & Lokasi</th>
                    <th className="py-3 px-4">Sub Ranting (Desa)</th>
                    <th className="py-3 px-4">Ketua Rayon / Kontak</th>
                    <th className="py-3 px-4">Akun Login Validator</th>
                    <th className="py-3 px-4">Status & Peran</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rayonList.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4">
                        <strong className="text-stone-900 font-bold block text-sm">
                          {r.nama_rayon}
                        </strong>
                        <span className="text-[11px] text-stone-500 block">
                          📍 {r.alamat_lokasi || "Lokasi latihan desa"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                          {r.desa?.nama_desa || "Semua Subranting"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-stone-900 block font-bold">
                          {r.nama_ketua}
                        </strong>
                        {r.no_wa && (
                          <a
                            href={`https://wa.me/${r.no_wa.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline text-[11px] font-mono flex items-center gap-1 mt-0.5"
                          >
                            <span>💬</span>
                            <span>{r.no_wa}</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-stone-800 block text-[11px] select-all">
                            📧 {r.email_akun}
                          </span>
                          <span className="font-mono text-amber-900 font-semibold block text-[11px]">
                            🔑 {r.password_hash}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                          Validator Aktif
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const text = `Halo ${r.nama_ketua}, berikut akun validator SIKAP Mantup untuk Rayon ${r.nama_rayon}:\nLink Login: https://ikspimantup.my.id/auth/login\nEmail: ${r.email_akun}\nKata Sandi: ${r.password_hash}`;
                              navigator.clipboard.writeText(text);
                              alert("Kredensial berhasil disalin ke clipboard! Silakan kirimkan ke WhatsApp Ketua Rayon.");
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            title="Salin kredensial untuk dikirim ke WA Ketua"
                          >
                            <span>📋</span>
                            <span>Salin Akun</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Hapus Rayon ${r.nama_rayon}?`)) {
                                await RayonService.delete(r.id);
                                const updated = await RayonService.getAllAsync();
                                setRayonList(updated);
                              }
                            }}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                            title="Hapus Rayon"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rayonList.length === 0 && (
              <div className="p-8 text-center text-xs text-stone-500">
                Belum ada Rayon yang didaftarkan. Klik tombol <strong>&quot;+ Daftarkan Rayon &amp; Buat Akun&quot;</strong> di atas untuk mendaftarkan titik latihan dan membuat akun validator bagi Ketua Rayon.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Tambah Rayon & Buat Akun Ketua Rayon */}
      {showAddRayonModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  Daftarkan Rayon & Akun Validator
                </h3>
                <p className="text-xs text-stone-500">
                  Buatkan akun resmi agar Ketua Rayon dapat membantu memvalidasi siswa & warga di wilayahnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRayonModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!namaRayonInput.trim() || !namaKetuaInput.trim() || !emailRayonInput.trim() || !passRayonInput.trim()) {
                  alert("Semua kolom bertanda bintang wajib diisi!");
                  return;
                }
                setIsSavingRayon(true);
                try {
                  const res = await RayonService.create({
                    nama_rayon: namaRayonInput,
                    desa_id: desaRayonInput,
                    nama_ketua: namaKetuaInput,
                    no_wa: waKetuaInput,
                    alamat_lokasi: alamatRayonInput,
                    email_akun: emailRayonInput,
                    password_plain: passRayonInput,
                  });
                  if (res.success) {
                    setRayonSuccessMsg(res.message);
                    const updated = await RayonService.getAllAsync();
                    setRayonList(updated);
                    setShowAddRayonModal(false);
                    setNamaRayonInput("");
                    setNamaKetuaInput("");
                    setWaKetuaInput("");
                    setAlamatRayonInput("");
                    setEmailRayonInput("");
                  } else {
                    alert(res.message);
                  }
                } finally {
                  setIsSavingRayon(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Nama Rayon / Tempat Latihan *
                </label>
                <input
                  type="text"
                  required
                  value={namaRayonInput}
                  onChange={(e) => setNamaRayonInput(e.target.value)}
                  placeholder="Contoh: Rayon SMPN 1 Mantup / Rayon Lapangan Desa"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-stone-300 text-stone-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Wilayah Sub Ranting (Desa) *
                  </label>
                  <select
                    value={desaRayonInput}
                    onChange={(e) => setDesaRayonInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-stone-300 text-stone-900 bg-white"
                  >
                    {DESA_MANTUP_LIST.map((d) => (
                      <option key={d.id} value={d.id}>{d.nama_desa}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Lokasi / Alamat Latihan
                  </label>
                  <input
                    type="text"
                    value={alamatRayonInput}
                    onChange={(e) => setAlamatRayonInput(e.target.value)}
                    placeholder="Contoh: Halaman SMPN 1 Mantup"
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-stone-300 text-stone-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Identitas Ketua Rayon & Kredensial Login Validator
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      Nama Ketua Rayon *
                    </label>
                    <input
                      type="text"
                      required
                      value={namaKetuaInput}
                      onChange={(e) => setNamaKetuaInput(e.target.value)}
                      placeholder="Contoh: Mas Joko Susilo"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      No. WhatsApp Ketua Rayon
                    </label>
                    <input
                      type="text"
                      value={waKetuaInput}
                      onChange={(e) => setWaKetuaInput(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      Email Akun Login Validator *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailRayonInput}
                      onChange={(e) => setEmailRayonInput(e.target.value)}
                      placeholder="Contoh: rayon.smpn1@gmail.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      Kata Sandi Login *
                    </label>
                    <input
                      type="text"
                      required
                      value={passRayonInput}
                      onChange={(e) => setPassRayonInput(e.target.value)}
                      placeholder="Kata Sandi"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 text-stone-900 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  disabled={isSavingRayon}
                  onClick={() => setShowAddRayonModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingRayon}
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {isSavingRayon ? "Mendaftarkan..." : "Daftarkan & Buat Akun"}
                </button>
              </div>
            </form>
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
                      : "No. Induk (KTA Pusat):"}
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
                  <span className="text-stone-400 block">Angkatan & Pengesahan:</span>
                  <span className="font-semibold text-stone-900">
                    {selectedAnggota.angkatan ? `Angkatan ${selectedAnggota.angkatan}` : ""}
                    {selectedAnggota.tanggal_pengesahan
                      ? ` • Disahkan: ${selectedAnggota.tanggal_pengesahan}`
                      : selectedAnggota.tahun_pengesahan
                      ? ` • Th. ${selectedAnggota.tahun_pengesahan}`
                      : ""}
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
                <div>
                  <span className="text-stone-400 block">Rayon / Tempat Latihan:</span>
                  <span className="font-semibold text-stone-900">{selectedAnggota.tempat_latihan || "-"}</span>
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
