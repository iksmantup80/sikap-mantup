"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formAnggotaSchema, FormAnggotaInput } from "@/lib/validations/anggota";
import { DESA_MANTUP_LIST } from "@/lib/constants/desas";
import { AnggotaService } from "@/lib/services/anggotaService";
import Link from "next/link";

interface Props {
  defaultDesaId?: string;
  sourceRole?: "mandiri" | "koordinator";
  onSuccess?: (tiket: string) => void;
}

export function FormPendataan({
  defaultDesaId,
  sourceRole = "mandiri",
  onSuccess,
}: Props) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    tiket?: string;
    message: string;
  } | null>(null);
  const [copiedTiket, setCopiedTiket] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormAnggotaInput>({
    resolver: zodResolver(formAnggotaSchema),
    defaultValues: {
      kategori_anggota: "warga",
      nama_lengkap: "",
      nik: "",
      nomor_kta: "",
      tempat_lahir: "",
      tanggal_lahir: "1998-01-01",
      jenis_kelamin: "L",
      desa_id: defaultDesaId || DESA_MANTUP_LIST[0].id,
      alamat_detail: "",
      rt_rw: "",
      nomor_wa: "",
      tingkatan: "Warga Tingkat 1",
      tahun_pengesahan: 2018,
      tempat_pengesahan: "Padepokan Pusat Madiun",
      tempat_latihan: "",
      nama_pelatih: "",
      status_keaktifan: "aktif",
      is_demo: false,
    },
  });

  const formValues = watch();
  const kategoriAnggota = watch("kategori_anggota");
  const [stepError, setStepError] = useState<string | null>(null);

  const handleNextStep = async () => {
    setStepError(null);
    let fieldsToValidate: (keyof FormAnggotaInput)[] = [];
    if (step === 1) {
      fieldsToValidate = [
        "nama_lengkap",
        "nik",
        "tempat_lahir",
        "tanggal_lahir",
        "jenis_kelamin",
        "nomor_wa",
      ];
    } else if (step === 2) {
      fieldsToValidate = ["desa_id", "alamat_detail", "rt_rw"];
    } else if (step === 3) {
      fieldsToValidate = [
        "tingkatan",
        "tahun_pengesahan",
        "status_keaktifan",
      ];
    }

    const valid = await trigger(fieldsToValidate);

    if (valid) {
      setStepError(null);
      setStep((prev) => Math.min(prev + 1, 4));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    } else {
      const errList: string[] = [];
      fieldsToValidate.forEach((f) => {
        const err = errors[f];
        if (err?.message) {
          errList.push(err.message);
        }
      });

      if (errList.length > 0) {
        setStepError(`Periksa kembali data Anda: ${errList.join(". ")}`);
      } else {
        setStepError("Mohon lengkapi seluruh kolom yang bertanda bintang (*) sebelum melanjutkan.");
      }
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: FormAnggotaInput) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Simulate submission to AnggotaService
      const res = await AnggotaService.submitPengajuanMandiri(data);
      setSubmitResult(res);
      if (res.success && res.tiket) {
        if (onSuccess) onSuccess(res.tiket);
      }
    } catch {
      setSubmitResult({
        success: false,
        message: "Terjadi kesalahan sistem saat memproses pengajuan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTiketToClipboard = () => {
    if (submitResult?.tiket) {
      navigator.clipboard.writeText(submitResult.tiket);
      setCopiedTiket(true);
      setTimeout(() => setCopiedTiket(false), 3000);
    }
  };

  if (submitResult?.success) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xl p-8 max-w-2xl mx-auto text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-black text-gray-900 mb-2">
          Pengajuan Berhasil Dikirim!
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Data Anda telah masuk ke sistem database internal SIKAP Ranting Mantup dan siap diverifikasi oleh petugas verifikator.
        </p>

        {/* Ticket Display */}
        <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-5 mb-6">
          <span className="text-xs uppercase font-bold text-amber-800 tracking-wider block mb-1">
            Nomor Tiket Pengajuan Anda
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-950 tracking-widest my-2 select-all">
            {submitResult.tiket}
          </div>
          <p className="text-xs text-amber-700">
            Simpan nomor tiket ini untuk memantau status persetujuan atau melihat catatan koreksi jika ada data yang perlu diperbaiki.
          </p>
          <button
            type="button"
            onClick={copyTiketToClipboard}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
          >
            {copiedTiket ? "✓ Berhasil Disalin" : "Salin Nomor Tiket"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/cek-tiket?tiket=${submitResult.tiket}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold text-sm shadow-md transition"
          >
            Pantau Status Tiket Ini
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitResult(null);
              setStep(1);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition"
          >
            Kirim Pengajuan Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden max-w-3xl mx-auto">
      {/* Header Form */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
            Formulir Pendataan Warga
          </span>
          <span className="text-xs text-amber-200/80 font-medium">
            Kecamatan Mantup • Kab. Lamongan
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-amber-100">
          Pendataan Warga IKSPI Ranting Mantup
        </h2>
        <p className="text-xs text-stone-300 mt-1">
          Lengkapi data identitas dan KTA fisik resmi Anda. Data yang diisi akan diverifikasi oleh pengurus ranting sebelum aktif.
        </p>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: "Pribadi" },
            { num: 2, label: "Domisili" },
            { num: 3, label: "Keanggotaan" },
            { num: 4, label: "Konfirmasi" },
          ].map((s) => (
            <div key={s.num} className="text-center">
              <div
                className={`h-2 rounded-full mb-1 transition-all ${
                  step >= s.num ? "bg-amber-400" : "bg-stone-700"
                }`}
              />
              <span
                className={`text-[11px] block font-medium ${
                  step >= s.num ? "text-amber-200 font-bold" : "text-stone-500"
                }`}
              >
                {s.num}. {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
        {submitResult?.success === false && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <svg
              className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <strong className="font-semibold block">Pemeriksaan Gagal</strong>
              <span>{submitResult.message}</span>
            </div>
          </div>
        )}

        {/* STEP 1: DATA PRIBADI */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">
                1
              </span>
              Data Identitas Pribadi
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Nama Lengkap (Sesuai KTP / Ijazah Warga) *
              </label>
              <input
                type="text"
                placeholder="Contoh: Mochamad Arifin"
                {...register("nama_lengkap")}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 transition ${
                  errors.nama_lengkap
                    ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30"
                    : "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                }`}
              />
              {errors.nama_lengkap && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {errors.nama_lengkap.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  NIK KTP (16 Digit - Opsional)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="3524xxxxxxxxxxxx"
                  {...register("nik")}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 transition ${
                    errors.nik
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30"
                      : "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  }`}
                />
                {errors.nik && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.nik.message}</p>
                )}
                <span className="text-[11px] text-gray-500">
                  Untuk verifikasi anti-duplikasi anggota ganda.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  {...register("nomor_wa")}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 transition ${
                    errors.nomor_wa
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30"
                      : "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  }`}
                />
                {errors.nomor_wa && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {errors.nomor_wa.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tempat Lahir *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lamongan"
                  {...register("tempat_lahir")}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 transition ${
                    errors.tempat_lahir
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30"
                      : "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  }`}
                />
                {errors.tempat_lahir && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {errors.tempat_lahir.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  {...register("tanggal_lahir")}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 transition ${
                    errors.tanggal_lahir
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/30"
                      : "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  }`}
                />
                {errors.tanggal_lahir && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {errors.tanggal_lahir.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  {...register("jenis_kelamin")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white"
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
                {errors.jenis_kelamin && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {errors.jenis_kelamin.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DOMISILI & SUBRANTING */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Domisili & Wilayah Subranting (Kec. Mantup)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Pilih Desa / Subranting di Kecamatan Mantup *
              </label>
              <select
                {...register("desa_id")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white font-medium"
              >
                {DESA_MANTUP_LIST.map((desa) => (
                  <option key={desa.id} value={desa.id}>
                    {desa.nama_desa} ({desa.kode_desa}) - Koord: {desa.nama_koordinator}
                  </option>
                ))}
              </select>
              {errors.desa_id && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.desa_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Alamat Lengkap (Dusun / Jalan / No. Rumah) *
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Dusun Mantup Tengah RT 02 RW 01, Dekat Balai Desa"
                {...register("alamat_detail")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900"
              />
              {errors.alamat_detail && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.alamat_detail.message}
                </p>
              )}
            </div>

            <div className="w-1/2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                RT / RW
              </label>
              <input
                type="text"
                placeholder="02/01"
                {...register("rt_rw")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900"
              />
            </div>
          </div>
        )}

        {/* STEP 3: RIWAYAT KEANGGOTAAN IKSPI */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">
                3
              </span>
              Kategori & Riwayat Keanggotaan IKSPI Kera Sakti
            </h3>

            {/* Pilihan Wajib: Warga vs Siswa */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Status Keanggotaan Anda di IKSPI Mantup *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    setValue("kategori_anggota", "warga");
                    if (formValues.tingkatan?.startsWith("Siswa") || formValues.tingkatan === "Calon Warga") {
                      setValue("tingkatan", "Warga Tingkat 1");
                      setValue("tempat_pengesahan", "Padepokan Pusat Madiun");
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    kategoriAnggota === "warga"
                      ? "bg-amber-50/90 border-amber-600 shadow-sm ring-1 ring-amber-400"
                      : "bg-white border-gray-200 hover:border-amber-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      value="warga"
                      checked={kategoriAnggota === "warga"}
                      onChange={() => {
                        setValue("kategori_anggota", "warga");
                        if (formValues.tingkatan?.startsWith("Siswa") || formValues.tingkatan === "Calon Warga") {
                          setValue("tingkatan", "Warga Tingkat 1");
                          setValue("tempat_pengesahan", "Padepokan Pusat Madiun");
                        }
                      }}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <strong className="text-sm font-black text-amber-950">
                      ⭐ Warga IKSPI Kera Sakti
                    </strong>
                  </div>
                  <p className="text-xs text-stone-600 pl-5 leading-relaxed">
                    Sudah disahkan resmi oleh Pusat Madiun / Cabang (memiliki tingkatan Warga Tk. 1, 2, 3, atau Pendekar).
                  </p>
                </div>

                <div
                  onClick={() => {
                    setValue("kategori_anggota", "siswa");
                    if (!formValues.tingkatan?.startsWith("Siswa") && formValues.tingkatan !== "Calon Warga") {
                      setValue("tingkatan", "Siswa Sabuk Kuning");
                      setValue("tempat_pengesahan", "Ranting Mantup");
                      setValue("nomor_kta", "");
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    kategoriAnggota === "siswa"
                      ? "bg-indigo-50/90 border-indigo-600 shadow-sm ring-1 ring-indigo-400"
                      : "bg-white border-gray-200 hover:border-indigo-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      value="siswa"
                      checked={kategoriAnggota === "siswa"}
                      onChange={() => {
                        setValue("kategori_anggota", "siswa");
                        if (!formValues.tingkatan?.startsWith("Siswa") && formValues.tingkatan !== "Calon Warga") {
                          setValue("tingkatan", "Siswa Sabuk Kuning");
                          setValue("tempat_pengesahan", "Ranting Mantup");
                          setValue("nomor_kta", "");
                        }
                      }}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <strong className="text-sm font-black text-indigo-950">
                      🥋 Siswa Latihan / Calon Warga
                    </strong>
                  </div>
                  <p className="text-xs text-stone-600 pl-5 leading-relaxed">
                    Sedang menempuh jenjang sabuk (Kuning, Biru, Merah) atau calon warga latihan di subranting desa Kec. Mantup.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM KHUSUS WARGA */}
            {kategoriAnggota === "warga" && (
              <div className="space-y-4 pt-2">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800">
                  <strong>Aturan Pencatatan KTA:</strong> Catat nomor KTA persis sebagaimana tercetak pada fisik kartu resmi yang diterbitkan Pusat Madiun. Sistem ranting tidak akan mengubah nomor ataupun mencetak KTA pengganti.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nomor KTA Pusat (Tercetak di Kartu Fisik)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1998.05.0123 (Kosongkan bila belum terbit)"
                    {...register("nomor_kta")}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 font-mono"
                  />
                  {errors.nomor_kta && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.nomor_kta.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Tingkatan Warga *
                    </label>
                    <select
                      {...register("tingkatan")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white"
                    >
                      <option value="Warga Tingkat 1">Warga Tingkat 1</option>
                      <option value="Warga Tingkat 2">Warga Tingkat 2</option>
                      <option value="Warga Tingkat 3">Warga Tingkat 3</option>
                      <option value="Pendekar / Warga Sepuh">Pendekar / Warga Sepuh</option>
                    </select>
                    {errors.tingkatan && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.tingkatan.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Tahun Pengesahan Warga *
                    </label>
                    <input
                      type="number"
                      min={1980}
                      max={new Date().getFullYear()}
                      {...register("tahun_pengesahan")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900"
                    />
                    {errors.tahun_pengesahan && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.tahun_pengesahan.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tempat Pengesahan *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Padepokan Pusat Madiun / Cabang Lamongan"
                    {...register("tempat_pengesahan")}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900"
                  />
                  {errors.tempat_pengesahan && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.tempat_pengesahan.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* FORM KHUSUS SISWA */}
            {kategoriAnggota === "siswa" && (
              <div className="space-y-4 pt-2">
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs text-indigo-900">
                  <strong>Pencatatan Siswa:</strong> Seluruh siswa aktif di 15 subranting desa Kec. Mantup wajib terdata untuk monitoring jenjang sabuk, keaktifan latihan, dan kesiapan pengesahan.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Jenjang Sabuk Siswa *
                    </label>
                    <select
                      {...register("tingkatan")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white font-medium"
                    >
                      <option value="Siswa Sabuk Kuning">Siswa Sabuk Kuning</option>
                      <option value="Siswa Sabuk Biru">Siswa Sabuk Biru</option>
                      <option value="Siswa Sabuk Merah">Siswa Sabuk Merah</option>
                      <option value="Calon Warga">Calon Warga (Persiapan Pengesahan)</option>
                    </select>
                    {errors.tingkatan && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.tingkatan.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Tahun Mulai Latihan / Target Pengesahan *
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={new Date().getFullYear() + 2}
                      {...register("tahun_pengesahan")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                    />
                    {errors.tahun_pengesahan && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.tahun_pengesahan.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Tempat / Lokasi Latihan Subranting *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: SDN 1 Sukobendu / Halaman Balai Desa"
                      {...register("tempat_latihan")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Nama Pelatih / Pembina Rayon
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Mas Joko / Mas Arifin"
                      {...register("nama_pelatih")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status Keaktifan (Berlaku untuk Warga & Siswa) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Status Keaktifan Latihan / Organisasi *
              </label>
              <select
                {...register("status_keaktifan")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white"
              >
                <option value="aktif">Aktif (Rutin Mengikuti Latihan / Kegiatan Ranting Mantup)</option>
                <option value="pasif">Pasif (Lama Tidak Latihan / Izin Sementara)</option>
                <option value="mutasi_keluar">Mutasi Keluar (Pindah Tempat Latihan / Wilayah Luar)</option>
                <option value="meninggal">Wafat / Almarhum (Pencatatan Sejarah)</option>
              </select>
              {errors.status_keaktifan && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.status_keaktifan.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: KONFIRMASI & PERIKSA DATA */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">
                4
              </span>
              Konfirmasi Ringkasan Data Sebelum Dikirim
            </h3>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-2 text-stone-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400 block">Kategori Anggota:</span>
                  <strong className="text-amber-900 uppercase">
                    {formValues.kategori_anggota === "siswa" ? "🥋 Siswa Latihan" : "⭐ Warga Disahkan"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Nama Lengkap:</span>
                  <strong className="text-gray-900 text-sm">{formValues.nama_lengkap}</strong>
                </div>

                {formValues.kategori_anggota === "warga" ? (
                  <div>
                    <span className="text-stone-400 block">Nomor KTA:</span>
                    <strong className="text-amber-800 font-mono">
                      {formValues.nomor_kta || "(Belum Tercatat)"}
                    </strong>
                  </div>
                ) : (
                  <div>
                    <span className="text-stone-400 block">Tempat Latihan:</span>
                    <strong className="text-indigo-900">
                      {formValues.tempat_latihan || "Subranting Desa"}
                    </strong>
                  </div>
                )}

                <div>
                  <span className="text-stone-400 block">WhatsApp:</span>
                  <span>{formValues.nomor_wa}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Desa Subranting:</span>
                  <span>
                    {DESA_MANTUP_LIST.find((d) => d.id === formValues.desa_id)?.nama_desa}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Tingkatan / Sabuk:</span>
                  <span>
                    {formValues.tingkatan} ({formValues.tahun_pengesahan})
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Status Keaktifan:</span>
                  <span className="capitalize font-semibold text-emerald-800">{formValues.status_keaktifan}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Pernyataan Kejujuran & Keabsahan:</p>
              <p>
                Saya menyatakan bahwa data yang dimasukkan adalah benar data keanggotaan (Warga/Siswa) IKSPI Kera Sakti saya di wilayah Ranting Mantup, dan siap diverifikasi oleh pengurus.
              </p>
            </div>
          </div>
        )}

        {/* Step Error Notification Banner */}
        {stepError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-shake">
            <span className="text-lg shrink-0">⚠️</span>
            <span>{stepError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
            >
              Kembali
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md transition"
            >
              Lanjut ke Langkah {step + 1} →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-lg bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white font-bold text-sm shadow-lg transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Memeriksa & Menyimpan...
                </>
              ) : (
                "Kirim Pengajuan Sekarang"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
