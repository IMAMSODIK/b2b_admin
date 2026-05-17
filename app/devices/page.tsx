"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type PairingCodeOut = {
  pairing_code: string;
  expires_at: string;
};

type DeviceRow = {
  id: string;
  name: string;
  location: string;
  timezone: string;
  status: string;
  last_seen_at: string | null;
  people_counting_enabled: boolean;
  last_ip: string | null;
  stream_url: string | null;
};

function CopyChip({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button className="copy-chip" onClick={copy} title={`Salin: ${value}`}>
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
      {label || value.slice(0, 12) + "…"}
    </button>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>Konfirmasi Hapus</p>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "4px 0 0" }}>{message}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-secondary btn-sm" onClick={onCancel}>Batal</button>
          <button className="btn-danger btn-sm" onClick={onConfirm}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Tidak diketahui";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function DevicesPage() {
  const [deviceName, setDeviceName] = useState("Lobby-1");
  const [location, setLocation] = useState("Jakarta HQ");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [pairCode, setPairCode] = useState<PairingCodeOut | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceRow | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadDevices();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function loadDevices() {
    setLoadingDevices(true);
    try {
      const rows = await api<DeviceRow[]>("/api/admin/devices");
      setDevices(rows);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingDevices(false);
    }
  }

  async function createCode() {
    if (!deviceName.trim()) { setError("Nama perangkat wajib diisi."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await api<PairingCodeOut>("/api/admin/devices/pairing-code", {
        method: "POST",
        body: JSON.stringify({ device_name: deviceName, location, timezone }),
      });
      setPairCode(data);
      await loadDevices();
      showToast("Kode pairing berhasil dibuat!");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function togglePeopleCounting(id: string, enabled: boolean) {
    await api(`/api/admin/devices/${id}/people-counting?enabled=${enabled}`, { method: "POST" });
    await loadDevices();
    showToast(enabled ? "People counting diaktifkan." : "People counting dinonaktifkan.");
  }

  async function removeDevice(id: string) {
    await api(`/api/admin/devices/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await loadDevices();
    showToast("Perangkat berhasil dihapus.");
  }

  function formatExpiry(iso: string): string {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso));
  }

  const isOnline = (d: DeviceRow) => {
    if (!d.last_seen_at) return false;
    return Date.now() - new Date(d.last_seen_at).getTime() < 5 * 60 * 1000;
  };

  return (
    <>
      {deleteTarget && (
        <ConfirmModal
          message={`Hapus perangkat "${deleteTarget.name}"? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={() => removeDevice(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, animation: "fadeIn 200ms ease" }}>
          <div className="toast-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            {toast}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>Manajemen Perangkat</p>
          <h1 className="page-title">Perangkat</h1>
          <p style={{ marginTop: 6, color: "#64748b", fontSize: "0.875rem" }}>Daftarkan layar baru dan pantau status perangkat yang terhubung.</p>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Daftarkan Perangkat Baru</h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: 20 }}>Isi informasi perangkat, lalu generate kode pairing untuk digunakan di Raspberry Pi.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label">Nama Perangkat</label>
              <input className="field" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="Contoh: Lobby TV" />
            </div>
            <div>
              <label className="label">Lokasi</label>
              <input className="field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Lantai 1 - Lobby" />
            </div>
            <div>
              <label className="label">Zona Waktu</label>
              <select className="field" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={createCode} disabled={loading}>
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Generate Kode Pairing
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={loadDevices} disabled={loadingDevices}>
              {loadingDevices ? "Memuat..." : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                  Refresh Daftar
                </>
              )}
            </button>
          </div>

          {error && <p className="error" style={{ marginTop: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</p>}

          {/* Pairing result */}
          {pairCode && (
            <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "#ecfdf5", border: "1px solid #bbf7d0" }}>
              <p style={{ fontWeight: 700, color: "#15803d", marginBottom: 4, fontSize: "0.875rem" }}>
                ✓ Kode pairing berhasil dibuat
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "monospace", color: "#0f766e", letterSpacing: "0.15em", background: "white", borderRadius: 8, padding: "6px 16px", border: "1px solid #d1fae5" }}>
                  {pairCode.pairing_code}
                </div>
                <CopyChip value={pairCode.pairing_code} label="Salin kode" />
              </div>
              <p style={{ fontSize: "0.78rem", color: "#166534" }}>Berlaku hingga: {formatExpiry(pairCode.expires_at)}</p>
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: "0.8rem", fontWeight: 600, color: "#15803d", cursor: "pointer" }}>Lihat perintah untuk Raspberry Pi</summary>
                <pre style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.7)", border: "1px solid #d1fae5", fontSize: "0.72rem", overflowX: "auto", color: "#064e3b" }}>
{`curl -X POST $API_BASE/api/device/enroll \\
  -H "Content-Type: application/json" \\
  -d '{"pairing_code":"${pairCode.pairing_code}","hostname":"rpi5-01","app_version":"1.0.0"}'`}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Device list */}
        {devices.length > 0 && (
          <div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>Perangkat Terdaftar ({devices.length})</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {devices.map((d) => {
                const online = isOnline(d);
                return (
                  <div key={d.id} className="card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: online ? "#ecfdf5" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={online ? "#16a34a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", margin: 0 }}>{d.name}</p>
                          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>{d.location}</p>
                        </div>
                      </div>
                      <span className={`badge ${online ? "badge-success" : "badge-danger"}`}>
                        <span style={{ width: 6, height: 6, borderRadius: 50, background: "currentColor", display: "inline-block" }} />
                        {online ? "Online" : "Offline"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.8rem", color: "#64748b", marginBottom: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                      <span>🕒 Terakhir aktif: {formatRelativeTime(d.last_seen_at)}</span>
                      {d.last_ip && <span>🌐 IP: {d.last_ip}</span>}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className={`btn-secondary btn-sm`}
                        onClick={() => togglePeopleCounting(d.id, !d.people_counting_enabled)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: 50, background: d.people_counting_enabled ? "#16a34a" : "#cbd5e1", display: "inline-block" }} />
                        Hitung Orang: {d.people_counting_enabled ? "Aktif" : "Nonaktif"}
                      </button>
                      {d.stream_url && (
                        <a className="btn-secondary btn-sm" href={d.stream_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem" }}>
                          📹 Live
                        </a>
                      )}
                      <button className="btn-danger btn-sm" onClick={() => setDeleteTarget(d)} style={{ marginLeft: "auto" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {devices.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              <p style={{ fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>Belum ada perangkat</p>
              <p style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>Klik "Refresh Daftar" untuk memuat perangkat yang sudah terdaftar.</p>
              <button className="btn-secondary btn-sm" onClick={loadDevices} style={{ marginTop: 12 }}>Muat Perangkat</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}
