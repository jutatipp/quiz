'use client';

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";

interface Member {
  _id: string; firstname: string; lastname: string; email: string;
  image?: string; role?: string; type?: string;
  education?: { major?: string; enrollmentYear?: string; studentId?: string; school?: { name?: string; province?: string; logo?: string; }; };
}
interface MembersResponse { data: Member[]; }

const currentYear = new Date().getFullYear();
const buildYearOptions = (range=10)=> Array.from({length:range},(_,i)=> String(currentYear-i));

export default function MembersPage() {
  const { isReady, user } = useAuth();
  const [year, setYear] = useState(String(currentYear));
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [q, setQ] = useState("");
  const yearOptions = useMemo(()=> buildYearOptions(10), []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!year) { setError("Please enter an enrollment year"); return; }
    if (!isReady) return;
    setIsLoading(true); setError(null);
    try {
      const res = await apiRequest<MembersResponse>({ path: `/classroom/class?year=${encodeURIComponent(year)}`, method: "GET" });
      setMembers(res.data); setHasSearched(true);
    } catch (e:any) { setError(e?.message ?? "Unable to fetch class members"); setMembers([]); }
    finally { setIsLoading(false); }
  };

  const list = members.filter(m => `${m.firstname} ${m.lastname} ${m.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="section">
      <div className="container grid" style={{gap:"20px"}}>
        <header>
          <p className="badge">Cohort directory</p>
          <h1 style={{fontSize:"clamp(2rem,4vw,2.6rem)", marginTop:"6px"}}>Search classmates by year</h1>
          <p className="kicker">Filter by enrollment year and quick-search by name/email.</p>
        </header>

        <form onSubmit={handleSubmit} className="card" style={{padding:"16px", display:"grid", gap:"12px"}}>
          <div style={{display:"grid", gap:"12px"}}>
            <label className="grid" style={{gap:"6px", maxWidth:"260px"}}>
              <span style={{fontWeight:800}}>Enrollment year (CE)</span>
              <input className="input" type="number" min="1900" max="2100" value={year}
                     onChange={(e)=> setYear(e.target.value)} placeholder="2024"/>
            </label>

            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {yearOptions.map(opt=>(
                <button key={opt} type="button"
                        className={`btn ${opt===year ? "btn--primary":"btn--muted"}`}
                        onClick={()=> setYear(opt)} aria-pressed={opt===year}>{opt}</button>
              ))}
            </div>

            <label className="grid" style={{gap:"6px"}}>
              <span style={{fontWeight:800}}>Search</span>
              <input className="input" placeholder="Type a name or email..." value={q} onChange={(e)=> setQ(e.target.value)}/>
            </label>
          </div>

          <div style={{display:"flex",gap:"12px"}}>
            <button className="btn btn--primary" type="submit" disabled={isLoading}>{isLoading?"Loading...":"Search"}</button>
            <button className="btn btn--muted" type="button" onClick={()=> setQ("")}>Clear</button>
          </div>
        </form>

        {!user && isReady && <p style={{color:"#8a1f16", fontWeight:800}}>Please sign in so we can attach your token.</p>}
        {error && <div className="card" style={{padding:"14px", color:"#8a1f16", fontWeight:800}}>{error}</div>}
        {hasSearched && !error && list.length===0 && <p className="kicker">No classmates found for {year}.</p>}

        {list.length>0 && (
          <ul className="grid grid--cards">
            {list.map(m=>(
              <li key={m._id} className="card" style={{padding:"18px"}}>
                <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                  <div className="avatar avatar--lg" aria-hidden />
                  <div>
                    <div style={{fontWeight:800}}>{m.firstname} {m.lastname}</div>
                    <div className="kicker">{m.email}</div>
                  </div>
                </div>
                <div style={{marginTop:"10px",fontSize:".96rem"}}>
                  {m.education?.major && <p><strong>Major:</strong> {m.education.major}</p>}
                  {m.education?.studentId && <p><strong>Student ID:</strong> {m.education.studentId}</p>}
                  {m.education?.school?.name && (
                    <p><strong>School:</strong> {m.education.school.name}{m.education.school.province?`, ${m.education.school.province}`:""}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
