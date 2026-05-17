"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "../../lib/api";
import { setAdminToken } from "../../lib/auth";

type LoginOut = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<LoginOut>("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAdminToken(data.access_token, data.expires_in);
      router.push("/devices");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="ambient-bg" />
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: 880,
          width: "100%",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(15,23,42,0.15)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}>
          {/* Left: Branding */}
          <div style={{
            background: "linear-gradient(145deg, #0f766e 0%, #0c4a6e 100%)",
            padding: "52px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "white",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 700, lineHeight: 1 }}>IklanQ</div>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.14em", opacity: 0.7, marginTop: 3 }}>Iklanmu, Lebih Mudah.</div>
                </div>
              </div>

              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", lineHeight: 1.1, margin: "0 0 16px", fontWeight: 700 }}>
                Kelola semua layar Anda dalam satu tempat.
              </h1>
              <p style={{ fontSize: "0.9rem", opacity: 0.8, lineHeight: 1.6 }}>
                Unggah konten, atur jadwal tayang, pantau analitik, dan monitoring perangkat dari dashboard terpusat.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40 }}>
              {[
                "Manajemen perangkat & pairing",
                "Playlist & penjadwalan otomatis",
                "Analitik tayangan real-time",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.83rem", opacity: 0.85 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 50, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ background: "white", padding: "52px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "#64748b", marginBottom: 8 }}>Akses Admin</p>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.9rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>Masuk ke Dashboard</h2>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: 8 }}>Gunakan email dan kata sandi yang diberikan oleh administrator.</p>
            </div>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Email</label>
                <input
                  className="field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label">Kata Sandi</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="field"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error.replace("Error: ", "")}
                </p>
              )}

              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4, padding: "13px" }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Memproses...
                  </>
                ) : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
