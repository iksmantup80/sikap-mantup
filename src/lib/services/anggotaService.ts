import { Anggota, DuplikatCandidate, PengajuanAnggota, StatusVerifikasi } from "@/types/database";
import { DEMO_ANGGOTA, DEMO_PENGAJUAN } from "../mockData";
import { DESA_MANTUP_LIST } from "../constants/desas";
import { FormAnggotaInput } from "../validations/anggota";
import { createClient } from "../supabase/client";

// Database Awal Bersih dari Nol (Tanpa data palsu sesuai Master Prompt)
let localAnggotaList: Anggota[] = [];
let localPengajuanList: PengajuanAnggota[] = [];

export const AnggotaService = {
  // Mendapatkan semua anggota dengan filter terstruktur
  getAll: (filter?: {
    desa_id?: string;
    status_keaktifan?: string;
    status_verifikasi?: string;
    search?: string;
  }): Anggota[] => {
    return localAnggotaList.filter((item) => {
      if (filter?.desa_id && item.desa_id !== filter.desa_id) return false;
      if (filter?.status_keaktifan && item.status_keaktifan !== filter.status_keaktifan) return false;
      if (filter?.status_verifikasi && item.status_verifikasi !== filter.status_verifikasi) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matchName = item.nama_lengkap.toLowerCase().includes(q);
        const matchKta = item.nomor_kta?.toLowerCase().includes(q);
        const matchDesa = item.desa?.nama_desa.toLowerCase().includes(q);
        if (!matchName && !matchKta && !matchDesa) return false;
      }
      return true;
    });
  },

  getById: (id: string): Anggota | undefined => {
    return localAnggotaList.find((a) => a.id === id);
  },

  getByTiket: (kodeTiket: string): { pengajuan?: PengajuanAnggota; anggota?: Anggota } | null => {
    const p = localPengajuanList.find(
      (item) => item.kode_tiket.toUpperCase().trim() === kodeTiket.toUpperCase().trim()
    );
    if (!p) return null;
    const a = localAnggotaList.find((item) => item.id === p.anggota_id);
    return { pengajuan: p, anggota: a };
  },

  // Logika Anti-Duplikasi Otomatis
  periksaDuplikasi: (data: Partial<FormAnggotaInput>): {
    isDuplicate: boolean;
    reason?: string;
    matchedId?: string;
  } => {
    // 1. Cek duplikasi nomor KTA fisik jika diisi
    if (data.nomor_kta && data.nomor_kta.trim() !== "") {
      const matchKta = localAnggotaList.find(
        (a) =>
          a.nomor_kta &&
          a.nomor_kta.trim().toLowerCase() === data.nomor_kta?.trim().toLowerCase() &&
          a.status_verifikasi !== "ditolak"
      );
      if (matchKta) {
        return {
          isDuplicate: true,
          reason: `Nomor KTA '${data.nomor_kta}' sudah terdaftar dalam sistem atas nama ${matchKta.nama_lengkap}.`,
          matchedId: matchKta.id,
        };
      }
    }

    // 2. Cek kembar identitas (Nama lengkap persis + Tanggal lahir sama)
    if (data.nama_lengkap && data.tanggal_lahir) {
      const matchIdentity = localAnggotaList.find(
        (a) =>
          a.nama_lengkap.toLowerCase().trim() === data.nama_lengkap?.toLowerCase().trim() &&
          a.tanggal_lahir === data.tanggal_lahir &&
          a.status_verifikasi !== "ditolak"
      );
      if (matchIdentity) {
        return {
          isDuplicate: true,
          reason: `Identitas nama dan tanggal lahir ini sudah terdaftar atas nama ${matchIdentity.nama_lengkap}.`,
          matchedId: matchIdentity.id,
        };
      }
    }

    return { isDuplicate: false };
  },

  // Pengajuan Mandiri oleh Calon Anggota (Dengan sinkronisasi Supabase Cloud)
  submitPengajuanMandiri: async (
    input: FormAnggotaInput
  ): Promise<{ success: boolean; tiket?: string; message: string; anggotaId?: string }> => {
    const dupCheck = AnggotaService.periksaDuplikasi(input);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: dupCheck.reason || "Terdeteksi data ganda dalam database.",
      };
    }

    const desaObj = DESA_MANTUP_LIST.find((d) => d.id === input.desa_id);
    let newId = `agt-${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const tiketCode = `MTP-${dateStr}-${randomSuffix}`;

    // Sinkronisasi otomatis ke Supabase PostgreSQL jika URL & Key tersedia
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        // Cari UUID desa di database
        const { data: desaDb } = await supabase
          .from("wilayah_desa")
          .select("id")
          .eq("nama_desa", desaObj?.nama_desa)
          .single();

        const actualDesaId = desaDb?.id || input.desa_id;

        const { data: dbAgt, error: agtError } = await supabase
          .from("anggota")
          .insert({
            nomor_kta: input.nomor_kta ? input.nomor_kta.trim() : null,
            angkatan: input.angkatan ? String(input.angkatan).trim() : null,
            tanggal_pengesahan: input.tanggal_pengesahan || null,
            kategori_anggota: input.kategori_anggota || "warga",
            nama_lengkap: input.nama_lengkap,
            nik: input.nik || null,
            tempat_lahir: input.tempat_lahir,
            tanggal_lahir: input.tanggal_lahir,
            jenis_kelamin: input.jenis_kelamin,
            desa_id: actualDesaId,
            alamat_detail: input.alamat_detail,
            rt_rw: input.rt_rw || null,
            nomor_wa: input.nomor_wa,
            tingkatan: input.tingkatan,
            tahun_pengesahan: input.tahun_pengesahan,
            tempat_pengesahan: input.tempat_pengesahan || (input.kategori_anggota === "siswa" ? "Ranting Mantup" : "Padepokan Pusat Madiun"),
            tempat_latihan: input.tempat_latihan || null,
            nama_pelatih: input.nama_pelatih || null,
            status_keaktifan: input.status_keaktifan,
            status_verifikasi: "menunggu_verifikasi",
            foto_kta_url: input.foto_kta_url || null,
            foto_profil_url: input.foto_profil_url || null,
            is_demo: false,
          })
          .select("id")
          .single();

        if (!agtError && dbAgt) {
          newId = dbAgt.id;
          await supabase.from("pengajuan_anggota").insert({
            kode_tiket: tiketCode,
            anggota_id: dbAgt.id,
            tipe_pengajuan: "pendataan_mandiri",
            status: "menunggu_verifikasi",
          });
        }
      }
    } catch (e) {
      console.warn("Sinkronisasi cloud Supabase tertunda, data disimpan lokal:", e);
    }

    const newAnggota: Anggota = {
      id: newId,
      nomor_kta: input.nomor_kta ? input.nomor_kta.trim() : null,
      angkatan: input.angkatan ? String(input.angkatan).trim() : null,
      tanggal_pengesahan: input.tanggal_pengesahan || null,
      kategori_anggota: input.kategori_anggota || "warga",
      nama_lengkap: input.nama_lengkap,
      nik: input.nik || null,
      tempat_lahir: input.tempat_lahir,
      tanggal_lahir: input.tanggal_lahir,
      jenis_kelamin: input.jenis_kelamin,
      desa_id: input.desa_id,
      desa: desaObj,
      alamat_detail: input.alamat_detail,
      rt_rw: input.rt_rw || null,
      nomor_wa: input.nomor_wa,
      tingkatan: input.tingkatan,
      tahun_pengesahan: input.tahun_pengesahan,
      tempat_pengesahan: input.tempat_pengesahan || (input.kategori_anggota === "siswa" ? "Ranting Mantup" : "Padepokan Pusat Madiun"),
      tempat_latihan: input.tempat_latihan || null,
      nama_pelatih: input.nama_pelatih || null,
      status_keaktifan: input.status_keaktifan,
      status_verifikasi: "menunggu_verifikasi",
      foto_kta_url: input.foto_kta_url || null,
      foto_profil_url: input.foto_profil_url || null,
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newPengajuan: PengajuanAnggota = {
      id: `pgj-${Date.now()}`,
      kode_tiket: tiketCode,
      anggota_id: newId,
      anggota: newAnggota,
      tipe_pengajuan: "pendataan_mandiri",
      status: "menunggu_verifikasi",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localAnggotaList.unshift(newAnggota);
    localPengajuanList.unshift(newPengajuan);

    return {
      success: true,
      tiket: tiketCode,
      message: "Pengajuan berhasil dikirim! Silakan simpan nomor tiket Anda.",
      anggotaId: newId,
    };
  },

  // Verifikasi Dokumen & KTA oleh Verifikator Ranting
  prosesVerifikasi: (
    anggotaId: string,
    status: StatusVerifikasi,
    catatan: string,
    verifikatorNama: string = "Tim Verifikator Ranting"
  ): { success: boolean; message: string } => {
    const idx = localAnggotaList.findIndex((a) => a.id === anggotaId);
    if (idx === -1) {
      return { success: false, message: "Data anggota tidak ditemukan." };
    }

    localAnggotaList[idx] = {
      ...localAnggotaList[idx],
      status_verifikasi: status,
      catatan_verifikasi: catatan,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update status di pengajuan jika ada
    const pIdx = localPengajuanList.findIndex((p) => p.anggota_id === anggotaId);
    if (pIdx !== -1) {
      localPengajuanList[pIdx] = {
        ...localPengajuanList[pIdx],
        status: status,
        catatan_revisi: status === "perlu_koreksi" || status === "ditolak" ? catatan : null,
        updated_at: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: `Status berhasil diubah menjadi '${status}' oleh ${verifikatorNama}.`,
    };
  },

  // Deteksi Seluruh Duplikasi dalam Sistem untuk Admin
  getDaftarKandidatDuplikat: (): DuplikatCandidate[] => {
    const duplicates: DuplikatCandidate[] = [];

    for (let i = 0; i < localAnggotaList.length; i++) {
      for (let j = i + 1; j < localAnggotaList.length; j++) {
        const a1 = localAnggotaList[i];
        const a2 = localAnggotaList[j];

        // 1. KTA Sama
        if (
          a1.nomor_kta &&
          a2.nomor_kta &&
          a1.nomor_kta.trim().toLowerCase() === a2.nomor_kta.trim().toLowerCase()
        ) {
          duplicates.push({
            anggota1: a1,
            anggota2: a2,
            alasan: "KTA Sama",
            confidence: 95,
          });
          continue;
        }

        // 2. Nama & Tanggal Lahir sama
        if (
          a1.nama_lengkap.trim().toLowerCase() === a2.nama_lengkap.trim().toLowerCase() &&
          a1.tanggal_lahir === a2.tanggal_lahir
        ) {
          duplicates.push({
            anggota1: a1,
            anggota2: a2,
            alasan: "Nama & Tanggal Lahir Sama",
            confidence: 90,
          });
          continue;
        }

        // 3. Kontak WhatsApp sama
        if (a1.nomor_wa && a2.nomor_wa && a1.nomor_wa === a2.nomor_wa) {
          duplicates.push({
            anggota1: a1,
            anggota2: a2,
            alasan: "Nomor Kontak Sama",
            confidence: 60,
          });
        }
      }
    }

    return duplicates;
  },

  // Statistik Agregat untuk Dashboard Pengurus & Ranting
  getStatistik: () => {
    const total = localAnggotaList.length;
    const terverifikasi = localAnggotaList.filter((a) => a.status_verifikasi === "terverifikasi").length;
    const menunggu = localAnggotaList.filter((a) => a.status_verifikasi === "menunggu_verifikasi").length;
    const perluKoreksi = localAnggotaList.filter((a) => a.status_verifikasi === "perlu_koreksi").length;
    const ditolak = localAnggotaList.filter((a) => a.status_verifikasi === "ditolak").length;

    const aktif = localAnggotaList.filter((a) => a.status_keaktifan === "aktif").length;
    const pasif = localAnggotaList.filter((a) => a.status_keaktifan === "pasif").length;
    const mutasi = localAnggotaList.filter((a) => a.status_keaktifan === "mutasi_keluar").length;
    const meninggal = localAnggotaList.filter((a) => a.status_keaktifan === "meninggal").length;

    // Sebaran per desa
    const sebaranDesa = DESA_MANTUP_LIST.map((desa) => {
      const jumlah = localAnggotaList.filter((a) => a.desa_id === desa.id).length;
      return {
        ...desa,
        jumlahAnggota: jumlah,
      };
    }).sort((a, b) => b.jumlahAnggota - a.jumlahAnggota);

    return {
      total,
      terverifikasi,
      menunggu,
      perluKoreksi,
      ditolak,
      aktif,
      pasif,
      mutasi,
      meninggal,
      sebaranDesa,
    };
  },
};
