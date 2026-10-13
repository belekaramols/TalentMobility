import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, CurrentUser } from "../api/client";

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const location = useLocation();
  const nav = useQuery({ queryKey: ["nav"], queryFn: api.navigation });

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">TO THE NEW</div>
        <div className="sub">Talent Mobility &amp; Growth</div>
        {nav.data?.map((g) => (
          <div key={g.label}>
            <div className="nav-grp">{g.label}</div>
            {g.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <div className="main">
        <header className="topbar">
          <span>{location.pathname}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13 }}>{user.fullName}</span>
            {user.profilePicUrl ? (
              <img src={user.profilePicUrl} alt="" width={32} height={32} style={{ borderRadius: "50%" }} />
            ) : (
              <div className="av">{user.fullName.slice(0, 2).toUpperCase()}</div>
            )}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
