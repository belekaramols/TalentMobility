import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function ProfilePage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.profile });
  const p = profile.data as Record<string, string> | undefined;
  if (!p) return <p>Loading…</p>;

  return (
    <div>
      <h2 className="page-title">My profile</h2>
      <div style={{ display: "flex", gap: 24 }}>
        {p.profilePicUrl && <img src={p.profilePicUrl} alt="" width={120} height={120} style={{ borderRadius: 8 }} />}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
          <div><small>Full name</small><br />{p.fullName}</div>
          <div><small>Email</small><br />{p.userName}</div>
          <div><small>Designation</small><br />{p.designation}</div>
          <div><small>Competency</small><br />{p.competencyName}</div>
          <div><small>Business unit</small><br />{p.businessUnitName}</div>
          <div><small>Newer ID</small><br />{p.newerId}</div>
        </div>
      </div>
    </div>
  );
}
