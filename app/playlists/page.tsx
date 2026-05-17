"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

type AssetRow = {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
};

type PlaylistRow = {
  id: string;
  name: string;
  item_count: number;
  created_at: string;
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
      {label || "Salin ID"}
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

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default function PlaylistsPage() {
  const [name, setName] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [uploadResult, setUploadResult] = useState<{ asset_id: string; size_bytes: number } | null>(null);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "asset" | "playlist"; id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showMsg(msg: string, type: "success" | "error" = "success") {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function loadLists() {
    try {
      const [assetRows, playlistRows] = await Promise.all([
        api<AssetRow[]>("/api/admin/assets"),
        api<PlaylistRow[]>("/api/admin/playlists"),
      ]);
      setAssets(assetRows);
      setPlaylists(playlistRows);
    } catch (err) {
      showMsg(String(err), "error");
    }
  }

  useEffect(() => { loadLists(); }, []);

  async function createPlaylist() {
    if (!name.trim()) { showMsg("Nama playlist wajib diisi.", "error"); return; }
    try {
      const data = await api<{ id: string; name: string }>(`/api/admin/playlists?name=${encodeURIComponent(name)}`, { method: "POST" });
      setPlaylistId(data.id);
      showMsg(`Playlist "${data.name}" berhasil dibuat!`);
      setName("");
      await loadLists();
    } catch (err) {
      showMsg(String(err), "error");
    }
  }

  async function addItem() {
    if (!playlistId || !assetId) { showMsg("Pilih playlist dan video terlebih dahulu.", "error"); return; }
    try {
      await api(`/api/admin/playlists/${playlistId}/items?asset_id=${assetId}`, { method: "POST" });
      showMsg("Video berhasil ditambahkan ke playlist!");
      await loadLists();
    } catch (err) {
      showMsg(String(err), "error");
    }
  }

  async function uploadVideo(f: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const data = await api<{ asset_id: string; sha256: string; size_bytes: number }>("/api/admin/assets/upload", {
        method: "POST", body: form,
      });
      setUploadResult(data);
      setAssetId(data.asset_id);
      showMsg(`Upload berhasil! (${formatSize(data.size_bytes)})`);
      await loadLists();
    } catch (err) {
      showMsg(String(err), "error");
    } finally {
      setUploading(false);
      setFile(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "asset") {
        await api(`/api/admin/assets/${deleteTarget.id}`, { method: "DELETE" });
        showMsg("Video berhasil dihapus.");
      } else {
        await api(`/api/admin/playlists/${deleteTarget.id}`, { method: "DELETE" });
        showMsg("Playlist berhasil dihapus.");
      }
      await loadLists();
    } catch (err) {
      showMsg(String(err), "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); uploadVideo(dropped); }
  }

  return (
    <>
      {deleteTarget && (
        <ConfirmModal
          message={`Hapus "${deleteTarget.name}"? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>Kampanye</p>
          <h1 className="page-title">Playlist & Video</h1>
          <p style={{ marginTop: 6, color: "#64748b", fontSize: "0.875rem" }}>Unggah video, buat playlist, dan susun konten yang akan ditayangkan.</p>
        </div>

        {/* Toast */}
        {message && (
          <div className={msgType === "success" ? "toast-success" : "toast-error"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{msgType === "success" ? <polyline points="20 6 9 17 4 12" /> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}</svg>
            {message}
          </div>
        )}

        {/* Step 1: Upload video */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>1</div>
            <div>
              <h2 className="section-title">Unggah Video</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Drag & drop file video atau klik untuk memilih</p>
            </div>
          </div>

          <div
            className={`dropzone${dragOver ? " drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); uploadVideo(f); } }}
            />
            {uploading ? (
              <div style={{ color: "#0f766e" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 10px", display: "block", animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <p style={{ fontWeight: 600, margin: 0 }}>Mengunggah...</p>
              </div>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 4px" }}>Klik atau seret video ke sini</p>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>Format MP4, MOV · Maksimum disarankan 500 MB</p>
              </>
            )}
          </div>

          {uploadResult && (
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "#ecfdf5", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontWeight: 700, color: "#15803d", margin: "0 0 4px", fontSize: "0.875rem" }}>✓ Video berhasil diunggah</p>
                <p style={{ fontSize: "0.78rem", color: "#166534", margin: 0 }}>Ukuran: {formatSize(uploadResult.size_bytes)}</p>
              </div>
              <CopyChip value={uploadResult.asset_id} label="Salin Asset ID" />
            </div>
          )}
        </div>

        {/* Step 2 + 3 in a grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Step 2: Create playlist */}
          <div className="card" style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>2</div>
              <div>
                <h2 className="section-title">Buat Playlist</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Beri nama untuk kumpulan video</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Promo Pagi" />
              </div>
              <button className="btn-primary" onClick={createPlaylist}>Buat</button>
            </div>
          </div>

          {/* Step 3: Add item */}
          <div className="card" style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>3</div>
              <div>
                <h2 className="section-title">Tambah Video ke Playlist</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Hubungkan video dengan playlist</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select className="field" value={playlistId} onChange={(e) => setPlaylistId(e.target.value)}>
                <option value="">— Pilih playlist —</option>
                {playlists.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.item_count} video)</option>)}
              </select>
              <select className="field" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                <option value="">— Pilih video —</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.filename} · {formatSize(a.size_bytes)}</option>)}
              </select>
              <button className="btn-primary" onClick={addItem} disabled={!playlistId || !assetId}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Tambah ke Playlist
              </button>
            </div>
          </div>
        </div>

        {/* Lists */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Assets */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Video Tersimpan</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 16 }}>{assets.length} video diunggah</p>
            {assets.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <p style={{ color: "#cbd5e1" }}>Belum ada video diunggah</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {assets.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #f1f5f9", background: "#fafcff" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.868v6.264a1 1 0 0 1-1.447.906L15 14" /><rect x="3" y="6" width="12" height="12" rx="2" /></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.82rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.filename}</p>
                      <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>{formatSize(a.size_bytes)}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <CopyChip value={a.id} />
                      <button className="btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "asset", id: a.id, name: a.filename })} style={{ padding: "4px 8px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Playlists */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Daftar Playlist</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 16 }}>{playlists.length} playlist aktif</p>
            {playlists.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <p style={{ color: "#cbd5e1" }}>Belum ada playlist dibuat</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {playlists.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #f1f5f9", background: "#fafcff" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.82rem", margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>{p.item_count} video</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <CopyChip value={p.id} />
                      <button className="btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "playlist", id: p.id, name: p.name })} style={{ padding: "4px 8px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
