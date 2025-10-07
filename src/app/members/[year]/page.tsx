interface YearPageProps { params: { year: string }; }
export default function MembersByYearPage({ params }: YearPageProps) {
  return (
    <section className="stack-16" style={{ minHeight:"60vh" }}>
      <span className="badge">Cohort {params.year}</span>
      <h1 className="h1">Members — {params.year}</h1>
      <p className="lead">This view can reuse the same API as <code>/members</code> but auto-filters by the route parameter.</p>
      <div className="card" style={{ padding:16 }}>
        <p className="lead">Coming soon: list & filter of classmates enrolled in {params.year}.</p>
      </div>
    </section>
  );
}
