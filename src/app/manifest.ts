import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIKAP Mantup — IKSPI Kera Sakti",
    short_name: "SIKAP Mantup",
    description:
      "Sistem Informasi Keanggotaan dan Administrasi Perguruan IKSPI Kera Sakti Ranting Mantup, Kec. Mantup, Kab. Lamongan",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#b91c1c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
