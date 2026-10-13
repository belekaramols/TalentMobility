export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h2 className="page-title">{title}</h2>
      <div className="stub">
        <strong>Coming in next release</strong>
        <p>Aligned with Talent Mobility architecture roadmap (HRIS, LMS, mobility workflows).</p>
      </div>
    </div>
  );
}
