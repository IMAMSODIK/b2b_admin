"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="ambient-bg" />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 64, height: 64, borderRadius: 18, marginBottom: 20,
              background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <h1 className="page-title" style={{ marginBottom: 12 }}>IklanQ</h1>
            <p style={{ fontSize: "1rem", color: "#64748b", maxWidth: 480, margin: "0 auto 28px" }}>
              Platform manajemen layar digital terpusat — kelola konten, jadwal, dan analitik untuk semua perangkat Anda.
            </p>
            <Link className="btn-primary" href="/login" style={{ padding: "12px 32px", fontSize: "0.95rem" }}>
              Masuk ke Dashboard →
            </Link>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
                color: "#0f766e", bg: "#ecfdf5",
                num: "1", title: "Daftarkan Perangkat",
                desc: "Generate kode pairing dan hubungkan Raspberry Pi ke sistem.",
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6M21 6H8" /><rect x="2" y="3" width="13" height="18" rx="2" /><path d="M9 10l4 2-4 2v-4z" /></svg>,
                color: "#7c3aed", bg: "#f5f3ff",
                num: "2", title: "Upload & Playlist",
                desc: "Unggah video iklan dan susun dalam playlist.",
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
                color: "#d97706", bg: "#fffbeb",
                num: "3", title: "Atur Jadwal",
                desc: "Tentukan waktu tayang dan hubungkan ke perangkat.",
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M18 9l-5 5-4-4-4 4" /></svg>,
                color: "#0284c7", bg: "#f0f9ff",
                num: "4", title: "Pantau Analitik",
                desc: "Lihat jumlah tayangan dan performa konten.",
              },
            ].map((f) => (
              <div key={f.num} className="card" style={{ padding: "20px 18px" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: f.bg,
                  color: f.color, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}>
                  {f.icon}
                </div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: f.color, marginBottom: 6 }}>
                  Langkah {f.num}
                </p>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
