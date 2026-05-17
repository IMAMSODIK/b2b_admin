"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { clearAdminToken, getAdminToken } from "../lib/auth";

const navItems = [
  {
    href: "/devices",
    label: "Perangkat",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    href: "/playlists",
    label: "Playlist & Video",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15V6M21 6H8M21 6l-4 4" />
        <rect x="2" y="3" width="13" height="18" rx="2" />
        <path d="M9 10l4 2-4 2v-4z" />
      </svg>
    ),
  },
  {
    href: "/schedules",
    label: "Jadwal Tayang",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analitik",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18 9l-5 5-4-4-4 4" />
      </svg>
    ),
  },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const isPublicRoute = useMemo(() => pathname === "/login" || pathname === "/", [pathname]);

  useEffect(() => {
    const token = getAdminToken();
    const hasToken = Boolean(token);

    if (isPublicRoute && hasToken && pathname !== "/") {
      router.replace("/devices");
      setAuthorized(true);
      setReady(true);
      return;
    }

    if (!isPublicRoute && !hasToken) {
      router.replace("/login");
      setAuthorized(false);
      setReady(true);
      return;
    }

    setAuthorized(hasToken);
    setReady(true);
  }, [isPublicRoute, pathname, router]);

  function logout() {
    clearAdminToken();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Memuat...
        </div>
      </div>
    );
  }

  if (!isPublicRoute && !authorized) {
    return null;
  }

  /* ── Public routes (login, home) — no sidebar ── */
  if (isPublicRoute) {
    return <>{children}</>;
  }

  /* ── Authenticated app shell with sidebar ── */
  return (
    <div className="app-shell">
      {/* ── Ambient background ── */}
      <div className="ambient-bg" />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div>
              <div className="sidebar-brand-name">IklanQ</div>
              <div className="sidebar-brand-sub">Iklanmu, Lebih Mudah.</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Utama</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item${pathname.startsWith(item.href) ? " active" : ""}`}
            >
              {item.icon}
              <span className="sidebar-item-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={logout} style={{ color: "#dc2626" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="sidebar-item-label">Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        <div className="page-wrap">
          {children}
        </div>
      </main>
    </div>
  );
}
