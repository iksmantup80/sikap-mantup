import { Anggota, DuplikatCandidate, PengajuanAnggota, StatusVerifikasi } from "@/types/database";
import { DESA_MANTUP_LIST } from "../constants/desas";
import { FormAnggotaInput } from "../validations/anggota";
import { createClient } from "../supabase/client";

// In-memory cache + localStorage persistence
let localAnggotaList: Anggota[] = [];
let localPengajuanList: PengajuanAnggota[] = [];

// Helper to generate UUID across all environments
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to initialize cache from localStorage in browser
function initFromLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const cachedAnggota = localStorage.getItem("sikap_cached_anggota");
    if (cachedAnggota) {
      localAnggotaList = JSON.parse(cachedAnggota);
    }
    const cachedPengajuan = localStorage.getItem("sikap_cached_pengajuan");
    if (cachedPengajuan) {
      localPengajuanList = JSON.parse(cachedPengajuan);
    }
  } catch (e) {
    console.warn("Gagal membaca localStorage:", e);
  }
}

// Helper to persist cache to localStorage
function saveToLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sikap_cached_anggota", JSON.stringify(localAnggotaList));
    localStorage.setItem("sikap_cached_pengajuan", JSON.stringify(localPengajuanList));
  } catch (e) {
    console.warn("Gagal menulis ke localStorage:", e);
  }
}

// Run initial hydration if on browser
if (typeof window !== "undefined") {
  initFromLocalStorage();
}

export const AnggotaService = {
  // Mendapatkan semua anggota dari cache memory secara sinkron
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

  // Mengambil data lengkap langsung dari Supabase Cloud (Live Sync)
  getAllAsync: async (filter?: {
    desa_id?: string;
    status_keaktifan?: string;
    status_verifikasi?: string;
    search?: string;
  }): Promise<Anggota[]> => {
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { data, error } = await supabase
          .from("anggota")
          .select("*, desa:wilayah_desa(*), pengajuan:pengajuan_anggota(*)")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          // Normalisasi data dari Supabase
          const remoteList: Anggota[] = data.map((item) => ({
            id: item.id,
            nomor_kta: item.nomor_kta || null,
            angkatan: item.angkatan || null,
            tanggal_pengesahan: item.tanggal_pengesahan || null,
            kategori_anggota: item.kategori_anggota || "warga",
            nama_lengkap: item.nama_lengkap,
            nik: item.nik || null,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            jenis_kelamin: item.jenis_kelamin,
            desa_id: item.desa_id,
            desa: item.desa || DESA_MANTUP_LIST.find((d) => d.id === item.desa_id),
            alamat_detail: item.alamat_detail,
            rt_rw: item.rt_rw || null,
            nomor_wa: item.nomor_wa,
            tingkatan: item.tingkatan,
            tahun_pengesahan: item.tahun_pengesahan,
            tempat_pengesahan: item.tempat_pengesahan,
            tempat_latihan: item.tempat_latihan || null,
            nama_pelatih: item.nama_pelatih || null,
            status_keaktifan: item.status_keaktifan,
            status_verifikasi: item.status_verifikasi,
            catatan_verifikasi: item.catatan_verifikasi || null,
            foto_kta_url: item.foto_kta_url || null,
            foto_profil_url: item.foto_profil_url || null,
            is_demo: item.is_demo || false,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));

          // Ekstrak pengajuan dari relasi anggota
          const remotePengajuan: PengajuanAnggota[] = [];
          data.forEach((item) => {
            if (item.pengajuan && Array.isArray(item.pengajuan)) {
              item.pengajuan.forEach((p: PengajuanAnggota) => {
                remotePengajuan.push({
                  ...p,
                  anggota: remoteList.find((a) => a.id === p.anggota_id),
                });
              });
            }
          });

          // Perbarui local cache
          localAnggotaList = remoteList;
          if (remotePengajuan.length > 0) {
            localPengajuanList = remotePengajuan;
          }
          saveToLocalStorage();
        }
      }
    } catch (err) {
      console.warn("Gagal sinkronisasi data dari Supabase, menggunakan cache lokal:", err);
    }

    return AnggotaService.getAll(filter);
  },

  getById: (id: string): Anggota | undefined => {
    return localAnggotaList.find((a) => a.id === id);
  },

  // Cek tiket secara sinkron dari cache lokal
  getByTiket: (kodeTiket: string): { pengajuan?: PengajuanAnggota; anggota?: Anggota } | null => {
    const cleanCode = kodeTiket.toUpperCase().trim();
    const p = localPengajuanList.find(
      (item) => item.kode_tiket.toUpperCase().trim() === cleanCode
    );
    if (!p) return null;
    const a = localAnggotaList.find((item) => item.id === p.anggota_id) || p.anggota;
    return { pengajuan: p, anggota: a };
  },

  // Cek status tiket pengajuan langsung ke Supabase Cloud (Live Data)
  getByTiketAsync: async (
    kodeTiket: string
  ): Promise<{ pengajuan?: PengajuanAnggota; anggota?: Anggota } | null> => {
    const cleanCode = kodeTiket.toUpperCase().trim();

    // 1. Coba fetch langsung dari Supabase Cloud
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { data: p, error: pErr } = await supabase
          .from("pengajuan_anggota")
          .select("*, anggota(*, desa:wilayah_desa(*))")
          .ilike("kode_tiket", cleanCode)
          .single();

        if (!pErr && p && p.anggota) {
          const matchedAnggota: Anggota = {
            id: p.anggota.id,
            nomor_kta: p.anggota.nomor_kta || null,
            angkatan: p.anggota.angkatan || null,
            tanggal_pengesahan: p.anggota.tanggal_pengesahan || null,
            kategori_anggota: p.anggota.kategori_anggota || "warga",
            nama_lengkap: p.anggota.nama_lengkap,
            nik: p.anggota.nik || null,
            tempat_lahir: p.anggota.tempat_lahir,
            tanggal_lahir: p.anggota.tanggal_lahir,
            jenis_kelamin: p.anggota.jenis_kelamin,
            desa_id: p.anggota.desa_id,
            desa: p.anggota.desa || DESA_MANTUP_LIST.find((d) => d.id === p.anggota.desa_id),
            alamat_detail: p.anggota.alamat_detail,
            rt_rw: p.anggota.rt_rw || null,
            nomor_wa: p.anggota.nomor_wa,
            tingkatan: p.anggota.tingkatan,
            tahun_pengesahan: p.anggota.tahun_pengesahan,
            tempat_pengesahan: p.anggota.tempat_pengesahan,
            tempat_latihan: p.anggota.tempat_latihan || null,
            nama_pelatih: p.anggota.nama_pelatih || null,
            status_keaktifan: p.anggota.status_keaktifan,
            status_verifikasi: p.anggota.status_verifikasi,
            catatan_verifikasi: p.anggota.catatan_verifikasi || null,
            foto_kta_url: p.anggota.foto_kta_url || null,
            foto_profil_url: p.anggota.foto_profil_url || null,
            is_demo: p.anggota.is_demo || false,
            created_at: p.anggota.created_at,
            updated_at: p.anggota.updated_at,
          };

          const matchedPengajuan: PengajuanAnggota = {
            id: p.id,
            kode_tiket: p.kode_tiket,
            anggota_id: p.anggota_id,
            tipe_pengajuan: p.tipe_pengajuan,
            status: p.status,
            catatan_revisi: p.catatan_revisi || null,
            created_at: p.created_at,
            updated_at: p.updated_at || p.created_at,
            anggota: matchedAnggota,
          };

          // Simpan ke local cache agar sinkron
          const existingIdx = localAnggotaList.findIndex((a) => a.id === matchedAnggota.id);
          if (existingIdx !== -1) {
            localAnggotaList[existingIdx] = matchedAnggota;
          } else {
            localAnggotaList.unshift(matchedAnggota);
          }

          const existingPIdx = localPengajuanList.findIndex((x) => x.id === matchedPengajuan.id);
          if (existingPIdx !== -1) {
            localPengajuanList[existingPIdx] = matchedPengajuan;
          } else {
            localPengajuanList.unshift(matchedPengajuan);
          }
          saveToLocalStorage();

          return {
            pengajuan: matchedPengajuan,
            anggota: matchedAnggota,
          };
        }
      }
    } catch (e) {
      console.warn("Gagal fetch tiket dari Supabase:", e);
    }

    // 2. Fallback ke memory lokal jika cloud gagal/offline
    return AnggotaService.getByTiket(cleanCode);
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

  // Pengajuan Mandiri oleh Calon Anggota (Dengan sinkronisasi Supabase Cloud & Local Storage)
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

    const desaObj = DESA_MANTUP_LIST.find((d) => d.id === input.desa_id) || DESA_MANTUP_LIST[0];
    const anggotaId = generateUUID();
    const pengajuanId = generateUUID();

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const tiketCode = `MTP-${dateStr}-${randomSuffix}`;

    const newAnggota: Anggota = {
      id: anggotaId,
      nomor_kta: input.nomor_kta ? input.nomor_kta.trim() : null,
      angkatan: input.angkatan ? String(input.angkatan).trim() : null,
      tanggal_pengesahan: input.tanggal_pengesahan || null,
      kategori_anggota: input.kategori_anggota || "warga",
      nama_lengkap: input.nama_lengkap.trim(),
      nik: input.nik ? input.nik.trim() : null,
      tempat_lahir: input.tempat_lahir.trim(),
      tanggal_lahir: input.tanggal_lahir,
      jenis_kelamin: input.jenis_kelamin,
      desa_id: desaObj.id,
      desa: desaObj,
      alamat_detail: input.alamat_detail.trim(),
      rt_rw: input.rt_rw || null,
      nomor_wa: input.nomor_wa.trim(),
      tingkatan: input.tingkatan,
      tahun_pengesahan: input.tahun_pengesahan,
      tempat_pengesahan:
        input.tempat_pengesahan ||
        (input.kategori_anggota === "siswa" ? "Ranting Mantup" : "Padepokan Pusat Madiun"),
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
      id: pengajuanId,
      kode_tiket: tiketCode,
      anggota_id: anggotaId,
      anggota: newAnggota,
      tipe_pengajuan: "pendataan_mandiri",
      status: "menunggu_verifikasi",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Simpan ke Supabase PostgreSQL Cloud
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { error: agtError } = await supabase.from("anggota").insert({
          id: anggotaId,
          nomor_kta: newAnggota.nomor_kta,
          angkatan: newAnggota.angkatan,
          tanggal_pengesahan: newAnggota.tanggal_pengesahan,
          kategori_anggota: newAnggota.kategori_anggota,
          nama_lengkap: newAnggota.nama_lengkap,
          nik: newAnggota.nik,
          tempat_lahir: newAnggota.tempat_lahir,
          tanggal_lahir: newAnggota.tanggal_lahir,
          jenis_kelamin: newAnggota.jenis_kelamin,
          desa_id: newAnggota.desa_id,
          alamat_detail: newAnggota.alamat_detail,
          rt_rw: newAnggota.rt_rw,
          nomor_wa: newAnggota.nomor_wa,
          tingkatan: newAnggota.tingkatan,
          tahun_pengesahan: newAnggota.tahun_pengesahan,
          tempat_pengesahan: newAnggota.tempat_pengesahan,
          tempat_latihan: newAnggota.tempat_latihan,
          nama_pelatih: newAnggota.nama_pelatih,
          status_keaktifan: newAnggota.status_keaktifan,
          status_verifikasi: "menunggu_verifikasi",
          foto_kta_url: newAnggota.foto_kta_url,
          foto_profil_url: newAnggota.foto_profil_url,
          is_demo: false,
        });

        if (agtError) {
          console.error("Gagal simpan anggota ke Supabase:", agtError);
        } else {
          const { error: pgjError } = await supabase.from("pengajuan_anggota").insert({
            id: pengajuanId,
            kode_tiket: tiketCode,
            anggota_id: anggotaId,
            tipe_pengajuan: "pendataan_mandiri",
            status: "menunggu_verifikasi",
          });

          if (pgjError) {
            console.error("Gagal simpan pengajuan ke Supabase:", pgjError);
          }
        }
      }
    } catch (e) {
      console.warn("Koneksi Supabase Cloud gagal, data disimpan ke cache browser:", e);
    }

    // 2. Simpan ke local memory dan localStorage
    localAnggotaList.unshift(newAnggota);
    localPengajuanList.unshift(newPengajuan);
    saveToLocalStorage();

    // 3. Simpan tiket terakhir ke localStorage pengguna agar tidak hilang saat refresh
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sikap_last_tiket", tiketCode);
        const myTikets = JSON.parse(localStorage.getItem("sikap_my_tikets") || "[]");
        if (!myTikets.includes(tiketCode)) {
          myTikets.unshift(tiketCode);
          localStorage.setItem("sikap_my_tikets", JSON.stringify(myTikets));
        }
      } catch (e) {
        console.warn("Gagal simpan tiket di localStorage:", e);
      }
    }

    return {
      success: true,
      tiket: tiketCode,
      message: "Pengajuan berhasil dikirim! Silakan simpan nomor tiket Anda.",
      anggotaId: anggotaId,
    };
  },

  // Verifikasi Dokumen & KTA secara sinkron lokal
  prosesVerifikasi: (
    anggotaId: string,
    status: StatusVerifikasi,
    catatan: string,
    verifikatorNama: string = "Tim Verifikator Ranting"
  ): { success: boolean; message: string } => {
    const idx = localAnggotaList.findIndex((a) => a.id === anggotaId);
    if (idx !== -1) {
      localAnggotaList[idx] = {
        ...localAnggotaList[idx],
        status_verifikasi: status,
        catatan_verifikasi: catatan,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

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

    saveToLocalStorage();

    return {
      success: true,
      message: `Status berhasil diubah menjadi '${status}' oleh ${verifikatorNama}.`,
    };
  },

  // Verifikasi Dokumen & KTA langsung sinkron ke Supabase Cloud (Live Update)
  prosesVerifikasiAsync: async (
    anggotaId: string,
    status: StatusVerifikasi,
    catatan: string,
    verifikatorNama: string = "Admin & Verifikator Ranting"
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Update ke Supabase Cloud
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const now = new Date().toISOString();

        await supabase
          .from("anggota")
          .update({
            status_verifikasi: status,
            catatan_verifikasi: catatan,
            verified_at: status === "terverifikasi" ? now : null,
            updated_at: now,
          })
          .eq("id", anggotaId);

        await supabase
          .from("pengajuan_anggota")
          .update({
            status: status,
            catatan_revisi: status === "perlu_koreksi" || status === "ditolak" ? catatan : null,
            updated_at: now,
          })
          .eq("anggota_id", anggotaId);
      }
    } catch (err) {
      console.warn("Gagal update status verifikasi ke Supabase Cloud:", err);
    }

    // 2. Update cache lokal & localStorage
    return AnggotaService.prosesVerifikasi(anggotaId, status, catatan, verifikatorNama);
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

  // Perbarui data profil & lampiran foto KTA oleh anggota
  updateAnggota: async (
    id: string,
    updates: Partial<Anggota>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { error } = await supabase
          .from("anggota")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) {
          console.error("Gagal update Supabase anggota:", error);
        }
      }
    } catch (e) {
      console.warn("Gagal update cloud, fallback to local:", e);
    }

    const idx = localAnggotaList.findIndex((a) => a.id === id);
    if (idx !== -1) {
      localAnggotaList[idx] = {
        ...localAnggotaList[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
    }

    const pIdx = localPengajuanList.findIndex((p) => p.anggota_id === id);
    if (pIdx !== -1 && localPengajuanList[pIdx].anggota) {
      localPengajuanList[pIdx] = {
        ...localPengajuanList[pIdx],
        anggota: {
          ...localPengajuanList[pIdx].anggota!,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      };
    }

    saveToLocalStorage();
    return { success: true, message: "Profil berhasil diperbarui." };
  },
};
