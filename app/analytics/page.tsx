"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

type Overview = {
  views_per_device: Array<{ device_id: string; views: number; viewers: number }>;
  views_per_ad: Array<{ asset_id: string; views: number; viewers: number }>;
  hourly: Array<{ hour: string; views: number; viewers: number }>;
  top_ads: Array<{ asset_id: string; views: number; viewers: number }>;
  low_ads: Array<{ asset_id: string; views: number; viewers: number }>;
};

type DeviceRow = {
  id: string;
  name: string;
  location: string;
  stream_url: string | null;
};

type AssetRow = {
  id: string;
  filename: string;
  size_bytes: number;
};

function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: 6, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #0f766e, #0891b2)", borderRadius: 999, transition: "width 400ms ease" }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [fromLocal, setFromLocal] = useState(toDateTimeLocal(sevenDaysAgo));
  const [toLocal, setToLocal] = useState(toDateTimeLocal(now));
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [streamDeviceId, setStreamDeviceId] = useState("");
  const [activePreset, setActivePreset] = useState(7);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<DeviceRow[]>("/api/admin/devices"),
      api<AssetRow[]>("/api/admin/assets"),
    ]).then(([deviceRows, assetRows]) => {
      setDevices(deviceRows);
      setAssets(assetRows);
    }).catch(() => {});
  }, []);

  const loadAnalytics = useCallback(async () => {
    setError("");
    setLoading(true);
    const fromIso = new Date(fromLocal).toISOString();
    const toIso = new Date(toLocal).toISOString();
    const qp = new URLSearchParams({ from_ts: fromIso, to_ts: toIso });
    if (deviceId.trim()) qp.set("device_id", deviceId.trim());
    try {
      const rows = await api<Overview>(`/api/admin/analytics/overview?${qp.toString()}`);
      setData(rows);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [fromLocal, toLocal, deviceId]);

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setFromLocal(toDateTimeLocal(from));
    setToLocal(toDateTimeLocal(to));
    setActivePreset(days);
  }

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  async function deleteAnalytics() {
    setDeleting(true);
    const fromIso = new Date(fromLocal).toISOString();
    const toIso = new Date(toLocal).toISOString();
    const qp = new URLSearchParams({ from_ts: fromIso, to_ts: toIso });
    if (deviceId.trim()) qp.set("device_id", deviceId.trim());
    try {
      await api(`/api/admin/analytics/data?${qp.toString()}`, { method: "DELETE" });
      setData(null);
      setConfirmDelete(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setDeleting(false);
    }
  }

  const totalViews = (data?.views_per_ad || []).reduce((acc, item) => acc + item.views, 0);
  const totalViewers = (data?.views_per_ad || []).reduce((acc, item) => acc + (item.viewers || 0), 0);
  const totalDevices = (data?.views_per_device || []).length;
  const totalAds = (data?.views_per_ad || []).length;
  const maxViewsPerAd = Math.max(...(data?.views_per_ad || []).map((a) => a.views), 1);
  const maxViewsPerDevice = Math.max(...(data?.views_per_device || []).map((d) => d.views), 1);
  const maxHourly = Math.max(...(data?.hourly || []).map((h) => h.views), 1);

  // Lookup maps: id → human-readable label
  const deviceMap = Object.fromEntries(devices.map((d) => [d.id, `${d.name} · ${d.location}`]));
  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.filename]));

  const presets = [
    { label: "24 Jam", days: 1 },
    { label: "7 Hari", days: 7 },
    { label: "30 Hari", days: 30 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>Hapus Data Analitik</p>
                <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "4px 0 0" }}>
                  Hapus semua data penayangan untuk periode yang dipilih{deviceId ? " pada perangkat ini" : ""}? Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary btn-sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>Batal</button>
              <button className="btn-danger btn-sm" onClick={deleteAnalytics} disabled={deleting}>
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div>
        <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>Performa</p>
        <h1 className="page-title">Analitik</h1>
        <p style={{ marginTop: 6, color: "#64748b", fontSize: "0.875rem" }}>Pantau tayangan konten berdasarkan perangkat dan periode waktu.</p>
      </div>

      {/* Filter card */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {presets.map((p) => (
            <button
              key={p.days}
              className={`day-pill${activePreset === p.days ? " active" : ""}`}
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label className="label">Dari</label>
            <input className="field" type="datetime-local" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} />
          </div>
          <div>
            <label className="label">Sampai</label>
            <input className="field" type="datetime-local" value={toLocal} onChange={(e) => setToLocal(e.target.value)} />
          </div>
          <div>
            <label className="label">Perangkat (opsional)</label>
            <select className="field" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              <option value="">— Semua perangkat —</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {d.location}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={loadAnalytics} disabled={loading}>
            {loading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            )}
            Muat Ulang
          </button>
          <button className="btn-danger" onClick={() => setConfirmDelete(true)} disabled={loading || !data}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Hapus Data
          </button>
        </div>
        {error && <p className="error" style={{ marginTop: 10 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</p>}
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ecfdf5" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div className="stat-value">{totalViews.toLocaleString("id-ID")}</div>
          <div className="stat-label">Total Penayangan</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fdf4ff" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-value">{totalViewers.toLocaleString("id-ID")}</div>
          <div className="stat-label">Total Penonton Kamera</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f0f9ff" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div className="stat-value">{totalDevices}</div>
          <div className="stat-label">Perangkat Aktif</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f5f3ff" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.868v6.264a1 1 0 0 1-1.447.906L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>
          </div>
          <div className="stat-value">{totalAds}</div>
          <div className="stat-label">Konten Dilacak</div>
        </div>
      </div>

      {/* Data tables */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {/* Per device */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Penayangan per Perangkat</h2>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 16 }}>Jumlah menit tayangan video di tiap layar</p>
          {(data?.views_per_device || []).length === 0 ? (
            <div className="empty-state"><p style={{ color: "#cbd5e1" }}>Tidak ada data</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data?.views_per_device || []).sort((a, b) => b.viewers - a.viewers).map((d, i) => (
                <div key={d.device_id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span title={d.device_id} style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
                      📺 {deviceMap[d.device_id] || `Perangkat ${i + 1}`}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#9333ea" }}>👁 {(d.viewers || 0).toLocaleString("id-ID")} penonton</span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{d.views.toLocaleString("id-ID")}× tayang</span>
                    </div>
                  </div>
                  <MiniBar value={d.viewers || 0} max={Math.max(...(data?.views_per_device || []).map((x) => x.viewers || 0), 1)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per ad */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Penayangan per Video</h2>
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 16 }}>Jumlah penayangan setiap video iklan (per menit diputar)</p>
          {(data?.views_per_ad || []).length === 0 ? (
            <div className="empty-state"><p style={{ color: "#cbd5e1" }}>Tidak ada data</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data?.views_per_ad || []).sort((a, b) => (b.viewers || 0) - (a.viewers || 0)).map((a) => (
                <div key={a.asset_id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
                      🎬 {assetMap[a.asset_id] || a.asset_id.slice(0, 16) + "…"}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#9333ea" }}>👁 {(a.viewers || 0).toLocaleString("id-ID")} penonton</span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{a.views.toLocaleString("id-ID")}× tayang</span>
                    </div>
                  </div>
                  <MiniBar value={a.viewers || 0} max={Math.max(...(data?.views_per_ad || []).map((x) => x.viewers || 0), 1)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hourly trend */}
        {(data?.hourly || []).length > 0 && (
          <div className="card" style={{ padding: "20px 24px" }}>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Tren Per Jam</h2>
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 16 }}>Volume tayangan sepanjang hari</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {data!.hourly.map((h) => {
                const pct = maxHourly > 0 ? (h.views / maxHourly) * 100 : 0;
                return (
                  <div key={h.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${h.hour}: ${h.views} tayangan`}>
                    <div style={{ width: "100%", height: `${pct}%`, minHeight: 2, background: "linear-gradient(180deg, #0f766e, #14b8a6)", borderRadius: "3px 3px 0 0", transition: "height 400ms ease" }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>00:00</span>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>12:00</span>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>23:00</span>
            </div>
          </div>
        )}
      </div>

      {/* Live camera */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <h2 className="section-title" style={{ marginBottom: 4 }}>Kamera Live</h2>
        <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 14 }}>Tampilkan stream langsung dari perangkat dengan overlay penghitung orang</p>
        {(() => {
          const streamDevices = devices.filter((d) => d.stream_url);
          const selectedDevice = devices.find((d) => d.id === streamDeviceId);
          const streamUrl = selectedDevice?.stream_url || "";
          return (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="label">Pilih Perangkat Kamera</label>
                <select className="field" value={streamDeviceId} onChange={(e) => setStreamDeviceId(e.target.value)}>
                  <option value="">— Pilih perangkat —</option>
                  {streamDevices.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} · {d.location}</option>
                  ))}
                </select>
                {streamDevices.length === 0 && (
                  <p className="hint">Tidak ada perangkat dengan stream aktif. Aktifkan people counting di halaman Perangkat.</p>
                )}
              </div>
              {streamUrl && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <a className="btn-secondary btn-sm" href={streamUrl} target="_blank" rel="noreferrer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Buka Tab Baru
                  </a>
                </div>
              )}
            </>
          );
        })()}
        {(() => {
          const selectedDevice = devices.find((d) => d.id === streamDeviceId);
          const streamUrl = selectedDevice?.stream_url || "";
          if (!streamDeviceId) return (
            <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#94a3b8" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.868v6.264a1 1 0 0 1-1.447.906L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>
              <p style={{ fontSize: "0.82rem" }}>Pilih perangkat untuk melihat live stream</p>
            </div>
          );
          return (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", background: "#000", aspectRatio: "16/9" }}>
              <img src={streamUrl} alt="Live stream" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          );
        })()}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
