"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type ScheduleRow = {
  id: string;
  name: string;
  timezone: string;
  priority: number;
  active: boolean;
  rules_count: number;
  created_at: string;
};

type PlaylistRow = {
  id: string;
  name: string;
  item_count: number;
};

type DeviceRow = {
  id: string;
  name: string;
  location: string;
};

type RuleRow = {
  id: string;
  playlist_id: string;
  days_of_week: number[];
  start_time: string | null;
  end_time: string | null;
  priority: number;
};

type BindingRow = {
  binding_id: string;
  device_id: string;
  device_name: string;
  device_location: string;
  schedule_id: string;
  schedule_name: string;
  schedule_timezone: string;
  priority: number;
};

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

const weekDays = [
  { value: 0, label: "Sen" },
  { value: 1, label: "Sel" },
  { value: 2, label: "Rab" },
  { value: 3, label: "Kam" },
  { value: 4, label: "Jum" },
  { value: 5, label: "Sab" },
  { value: 6, label: "Min" },
];

export default function SchedulesPage() {
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [scheduleId, setScheduleId] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [bindDeviceId, setBindDeviceId] = useState("");
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<ScheduleRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [editRules, setEditRules] = useState<RuleRow[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [bindings, setBindings] = useState<BindingRow[]>([]);

  function showMsg(m: string, type: "success" | "error" = "success") {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  }

  async function loadSchedules() {
    const [scheduleRows, playlistRows, bindingRows] = await Promise.all([
      api<ScheduleRow[]>("/api/admin/schedules"),
      api<PlaylistRow[]>("/api/admin/playlists"),
      api<BindingRow[]>("/api/admin/device-bindings"),
    ]);
    setSchedules(scheduleRows);
    setPlaylists(playlistRows);
    setBindings(bindingRows);
  }

  useEffect(() => {
    loadSchedules().catch((err) => showMsg(String(err), "error"));
    api<DeviceRow[]>("/api/admin/devices")
      .then((rows) => setDevices(rows))
      .catch(() => {});
  }, []);

  async function createSchedule() {
    if (!name.trim()) { showMsg("Nama jadwal wajib diisi.", "error"); return; }
    const data = await api<{ id: string; name: string }>(
      `/api/admin/schedules?name=${encodeURIComponent(name)}&timezone=${encodeURIComponent(timezone)}&priority=100`,
      { method: "POST" },
    );
    setScheduleId(data.id);
    showMsg(`Jadwal "${data.name}" berhasil dibuat!`);
    setName("");
    await loadSchedules();
  }

  async function addRule() {
    if (!scheduleId) { showMsg("Pilih jadwal terlebih dahulu.", "error"); return; }
    if (!playlistId) { showMsg("Pilih playlist terlebih dahulu.", "error"); return; }
    if (days.length === 0) { showMsg("Pilih minimal satu hari aktif.", "error"); return; }
    try {
      await api(
        `/api/admin/schedules/${scheduleId}/rules?playlist_id=${playlistId}&days_of_week=${encodeURIComponent(days.join(","))}&start_time=${startTime}:00&end_time=${endTime}:00&priority=100`,
        { method: "POST" },
      );
      showMsg("Aturan waktu berhasil ditambahkan!");
      await loadSchedules();
    } catch (err) { showMsg(String(err), "error"); }
  }

  async function bindScheduleToDevice() {
    if (!bindDeviceId || !scheduleId) { showMsg("Isi ID perangkat dan pilih jadwal terlebih dahulu.", "error"); return; }
    try {
      await api(`/api/admin/devices/${bindDeviceId}/bind-schedule?schedule_id=${scheduleId}&priority=100`, { method: "POST" });
      showMsg("Jadwal berhasil dihubungkan ke perangkat!");
      await loadSchedules();
    } catch (err) { showMsg(String(err), "error"); }
  }

  async function unbindSchedule(bindingId: string) {
    try {
      await api(`/api/admin/device-bindings/${bindingId}`, { method: "DELETE" });
      showMsg("Jadwal berhasil dilepaskan dari perangkat.");
      await loadSchedules();
    } catch (err) { showMsg(String(err), "error"); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await api(`/api/admin/schedules/${deleteTarget.id}`, { method: "DELETE" });
    showMsg("Jadwal berhasil dihapus.");
    setDeleteTarget(null);
    await loadSchedules();
  }

  async function openEdit(s: ScheduleRow) {
    setEditTarget(s);
    setEditName(s.name);
    setEditTimezone(s.timezone);
    const rules = await api<RuleRow[]>(`/api/admin/schedules/${s.id}/rules`);
    setEditRules(rules);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const qp = new URLSearchParams({ name: editName.trim(), timezone: editTimezone });
      await api(`/api/admin/schedules/${editTarget.id}?${qp}`, { method: "PATCH" });
      showMsg("Jadwal berhasil diperbarui!");
      setEditTarget(null);
      await loadSchedules();
    } catch (err) { showMsg(String(err), "error"); }
    finally { setEditSaving(false); }
  }

  async function deleteRule(ruleId: string) {
    if (!editTarget) return;
    await api(`/api/admin/schedules/${editTarget.id}/rules/${ruleId}`, { method: "DELETE" });
    setEditRules((prev) => prev.filter((r) => r.id !== ruleId));
    await loadSchedules();
  }

  function toggleDay(value: number) {
    setDays((prev) => prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort());
  }

  return (
    <>
      {deleteTarget && (
        <ConfirmModal
          message={`Hapus jadwal "${deleteTarget.name}"? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box" style={{ width: "min(95vw,560px)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a", margin: 0 }}>✏️ Edit Jadwal</p>
              <button className="btn-secondary btn-sm" onClick={() => setEditTarget(null)}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label className="label">Nama Jadwal</label>
                <input className="field" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="label">Zona Waktu</label>
                <select className="field" value={editTimezone} onChange={(e) => setEditTimezone(e.target.value)}>
                  {["Asia/Jakarta","Asia/Makassar","Asia/Jayapura","UTC"].map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontWeight: 600, fontSize: "0.82rem", color: "#475569", marginBottom: 8 }}>Aturan Waktu ({editRules.length})</p>
              {editRules.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Belum ada aturan waktu.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {editRules.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
                      <div>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, margin: 0 }}>
                          {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}
                        </p>
                        <p style={{ fontSize: "0.72rem", color: "#64748b", margin: "2px 0 0" }}>
                          {["Sen","Sel","Rab","Kam","Jum","Sab","Min"].filter((_, i) => r.days_of_week.includes(i)).join(", ")}
                        </p>
                      </div>
                      <button className="btn-danger btn-sm" style={{ padding: "3px 8px" }} onClick={() => deleteRule(r.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary btn-sm" onClick={() => setEditTarget(null)}>Batal</button>
              <button className="btn-primary btn-sm" onClick={saveEdit} disabled={editSaving || !editName.trim()}>
                {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>Penjadwalan</p>
          <h1 className="page-title">Jadwal Tayang</h1>
          <p style={{ marginTop: 6, color: "#64748b", fontSize: "0.875rem" }}>Atur kapan konten ditayangkan berdasarkan hari dan jam operasional.</p>
        </div>

        {msg && (
          <div className={msgType === "success" ? "toast-success" : "toast-error"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{msgType === "success" ? <polyline points="20 6 9 17 4 12" /> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}</svg>
            {msg}
          </div>
        )}

        {/* Create schedule */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>1</div>
            <div>
              <h2 className="section-title">Buat Jadwal</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Beri nama jadwal dan pilih zona waktu</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "flex-end" }}>
            <div>
              <label className="label">Nama Jadwal</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Promo Senin Pagi" />
            </div>
            <div>
              <label className="label">Zona Waktu</label>
              <select className="field" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Jakarta">WIB (Jakarta)</option>
                <option value="Asia/Makassar">WITA (Makassar)</option>
                <option value="Asia/Jayapura">WIT (Jayapura)</option>
              </select>
            </div>
            <button className="btn-primary" onClick={createSchedule}>Buat</button>
          </div>
        </div>

        {/* Add rule */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>2</div>
            <div>
              <h2 className="section-title">Tambah Aturan Waktu</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Tentukan hari, jam, dan playlist yang ditayangkan</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div>
              <label className="label">Jadwal</label>
              <select className="field" value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
                <option value="">— Pilih jadwal —</option>
                {schedules.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Playlist</label>
              <select className="field" value={playlistId} onChange={(e) => setPlaylistId(e.target.value)}>
                <option value="">— Pilih playlist —</option>
                {playlists.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.item_count} video)</option>)}
              </select>
            </div>
            <div>
              <label className="label">Jam Mulai</label>
              <input className="field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Jam Selesai</label>
              <input className="field" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Hari Aktif</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  className={`day-pill${days.includes(day.value) ? " active" : ""}`}
                  onClick={() => toggleDay(day.value)}
                  type="button"
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={addRule} disabled={!scheduleId || !playlistId || days.length === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Tambah Aturan
          </button>
        </div>

        {/* Bind to device */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>3</div>
            <div>
              <h2 className="section-title">Hubungkan ke Perangkat</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Aktifkan jadwal pada perangkat tertentu</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "flex-end" }}>
            <div>
              <label className="label">Pilih Perangkat</label>
              <select className="field" value={bindDeviceId} onChange={(e) => setBindDeviceId(e.target.value)}>
                <option value="">— Pilih perangkat —</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} · {d.location}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" onClick={bindScheduleToDevice} disabled={!scheduleId || !bindDeviceId}>Hubungkan</button>
          </div>
        </div>

        {/* Binding overview */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <h2 className="section-title" style={{ margin: 0 }}>Perangkat &amp; Jadwal Aktif</h2>
          </div>
          {bindings.length === 0 ? (
            <div className="empty-state"><p style={{ color: "#cbd5e1" }}>Belum ada perangkat yang dihubungkan ke jadwal.</p></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>📺 Perangkat</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>📅 Jadwal</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>Zona Waktu</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {bindings.map((b) => (
                    <tr key={b.binding_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 10px" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>{b.device_name}</p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>{b.device_location}</p>
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <span className="badge badge-info">{b.schedule_name}</span>
                      </td>
                      <td style={{ padding: "10px 10px", color: "#475569", fontSize: "0.8rem" }}>
                        {b.schedule_timezone}
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "right" }}>
                        <button
                          className="btn-danger btn-sm"
                          style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                          onClick={() => unbindSchedule(b.binding_id)}
                        >
                          Lepaskan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Existing schedules */}
        {schedules.length > 0 && (
          <div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>Jadwal Tersimpan ({schedules.length})</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {schedules.map((s) => (
                <div key={s.id} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{s.name}</p>
                    </div>
                  <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-secondary btn-sm" style={{ padding: "4px 8px" }} onClick={() => openEdit(s)} title="Edit jadwal">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => setDeleteTarget({ id: s.id, name: s.name })} style={{ padding: "4px 8px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="badge badge-info">{s.timezone.replace("Asia/", "")}</span>
                    <span className="badge badge-success">{s.rules_count} aturan</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
