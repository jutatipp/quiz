'use client';
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";

interface StatusAuthor { _id?:string; name?:string; email?:string; image?:string; }
interface StatusComment { _id:string; content:string; createdBy:string|StatusAuthor; like?:Array<string|StatusAuthor>; createdAt?:string; }
interface StatusItem { _id:string; content:string; createdBy:string|StatusAuthor; like?:Array<string|StatusAuthor>; likeCount?:number; hasLiked?:boolean; comment?:StatusComment[]; createdAt?:string; updatedAt?:string; }
interface StatusListResponse { data: StatusItem[]; }
interface StatusMutationResponse { data: StatusItem; }

function displayName(src: StatusItem["createdBy"]){ if(!src) return "Unknown"; return typeof src==="string"? src : (src.name ?? src.email ?? "Unknown"); }
function formatDate(v?:string){ if(!v) return ""; try{ return new Date(v).toLocaleString("th-TH",{dateStyle:"medium", timeStyle:"short"});}catch{ return v; } }
function isOwned(entry:string|StatusAuthor|undefined, id?:string, email?:string){
  if(!entry) return false; if(typeof entry==="string") return entry===id || entry===email;
  return entry._id===id || (!!email && entry.email===email);
}
function normalizeStatus(s:StatusItem, id?:string, email?:string):StatusItem{
  const likes = s.like ?? []; const likeCount = typeof s.likeCount==="number" ? s.likeCount : likes.length;
  let hasLiked = s.hasLiked ?? false; if(!hasLiked){ hasLiked = likes.some(e=> isOwned(e,id,email)); }
  return {...s, like:likes, likeCount, hasLiked, comment: s.comment ?? []};
}

export default function StatusesPage(){
  const { isReady, user } = useAuth();
  const [statuses,setStatuses]=useState<StatusItem[]>([]);
  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [composer,setComposer]=useState("");
  const [isPublishing,setIsPublishing]=useState(false);
  const [commentDrafts,setCommentDrafts]=useState<Record<string,string>>({});
  const [commentPending,setCommentPending]=useState<Record<string,boolean>>({});
  const [likePending,setLikePending]=useState<Record<string,boolean>>({});

  const uid = user?._id; const uemail = user?.email;
  const isAuth = useMemo(()=> isReady && !!user, [isReady, user]);

  const refresh = useCallback(async ()=>{
    if(!isAuth){ setStatuses([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try{
      const res = await apiRequest<StatusListResponse>({ path:"/classroom/status", method:"GET" });
      setStatuses((res.data ?? []).map(x=>normalizeStatus(x, uid, uemail)));
    }catch(err:any){
      setError(err?.message || "Unable to load status feed");
    }finally{ setIsLoading(false); }
  }, [isAuth, uid, uemail]);

  useEffect(()=>{ void refresh(); }, [refresh]);

  const likeLabel = (s:StatusItem)=>{ const c = s.likeCount ?? s.like?.length ?? 0; return c===0? "Be the first to like" : (c===1? "1 like" : `${c} likes`); };

  const handlePublish = async (e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); if(!composer.trim()){ setError("Please write something before publishing"); return; }
    setIsPublishing(true); setError(null);
    try{
      const res = await apiRequest<StatusMutationResponse>({ path:"/classroom/status", method:"POST", body:{ content: composer.trim() } });
      if(!res.data){ await refresh(); return; }
      setStatuses(prev=> [normalizeStatus(res.data, uid, uemail), ...prev]); setComposer("");
    }catch(err:any){ setError(err?.message || "Unable to publish status"); }
    finally{ setIsPublishing(false); }
  };

  const handleComment = async (statusId:string)=>{
    const draft = commentDrafts[statusId]?.trim(); if(!draft) return;
    setCommentPending(p=>({...p,[statusId]:true})); setError(null);
    try{
      const res = await apiRequest<StatusMutationResponse>({ path:"/classroom/comment", method:"POST", body:{ content:draft, statusId } });
      if(!res.data){ await refresh(); return; }
      const ns = normalizeStatus(res.data, uid, uemail);
      setStatuses(prev=> prev.map(it=> it._id===statusId? ns : it)); setCommentDrafts(prev=>({...prev,[statusId]:""}));
    }catch(err:any){ setError(err?.message || "Unable to add comment"); }
    finally{ setCommentPending(p=>({...p,[statusId]:false})); }
  };

  const toggleLike = async (s:StatusItem)=>{
    const id = s._id; const cur = !!s.hasLiked;
    setLikePending(p=>({...p,[id]:true})); setError(null);
    const optimistic = normalizeStatus({...s, likeCount:(s.likeCount ?? s.like?.length ?? 0) + (cur?-1:1), hasLiked:!cur}, uid, uemail);
    setStatuses(prev=> prev.map(it=> it._id===id? optimistic: it));
    try{
      const res = await apiRequest<StatusMutationResponse>({ path:"/classroom/like", method:"POST", body:{ statusId:id, action: cur? "unlike":"like" }});
      if(!res.data){ await refresh(); return; }
      const ns = normalizeStatus(res.data, uid, uemail);
      setStatuses(prev=> prev.map(it=> it._id===id? ns: it));
    }catch(err:any){
      setError(err?.message || "Unable to update like status");
      setStatuses(prev=> prev.map(it=> it._id===id? s: it));
    }finally{ setLikePending(p=>({...p,[id]:false})); }
  };

  if(!isReady){ return (<section className="container" style={{ paddingBlock:24 }}><p className="lead">Loading session...</p></section>); }
  if(!user){
    return (
      <section className="stack-24">
        <header className="stack-12">
          <span className="badge">Share updates with your cohort</span>
          <h1 className="h1">Status board</h1>
          <p className="lead">Please sign in to view and interact with statuses.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="stack-24">
      <header className="stack-12">
        <span className="badge">Share updates with your cohort</span>
        <h1 className="h1">Status board</h1>
        <p className="lead">Post quick updates, discuss with classmates, and celebrate each other.</p>
      </header>

      <form onSubmit={handlePublish} className="panel stack-16" style={{ padding:16 }}>
        <label className="stack-12">
          <span style={{ fontWeight:800 }}>Create a status</span>
          <textarea className="textarea" rows={4} value={composer} onChange={(e)=>setComposer(e.target.value)} placeholder="Share something with your classmates..." />
        </label>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p className="lead" style={{ fontSize:"0.95rem" }}>Posting as {user.firstname} {user.lastname}</p>
          <button className="btn btn--primary" type="submit" disabled={isPublishing}>{isPublishing? "Publishing..." : "Publish"}</button>
        </div>
      </form>

      {error && <div className="card" style={{ padding:16, borderColor:"#FFD1CC", background:"#FFF2F0" }}>{error}</div>}
      {isLoading && (
        <div className="card" style={{ padding:16 }}>
          <div className="skel" style={{height:14, width:"70%", marginBottom:10}}></div>
          <div className="skel" style={{height:14, width:"90%"}}></div>
        </div>
      )}
      {!isLoading && statuses.length===0 && <p className="lead">No statuses yet. Be the first!</p>}

      <div className="stack-24">
        {statuses.map((s)=>{
          const likeText = likeLabel(s);
          const comments = s.comment ?? [];
          const draft = commentDrafts[s._id] ?? "";

          return (
            <article key={s._id} className="card stack-16 card--hover" style={{ padding:16 }}>
              <header style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:999, background:"linear-gradient(135deg, #FFF1B6, #F5B800)" }} />
                <div>
                  <h2 style={{ fontSize:"1.05rem", fontWeight:900 }}>{displayName(s.createdBy)}</h2>
                  {s.createdAt && <span className="lead" style={{ fontSize:"0.9rem" }}>{formatDate(s.createdAt)}</span>}
                </div>
              </header>

              <p style={{ fontSize:"1.05rem", lineHeight:1.6 }}>{s.content}</p>

              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <button type="button"
                  onClick={()=>toggleLike(s)}
                  disabled={likePending[s._id]}
                  className="btn btn--ghost"
                  style={{
                    height:36, padding:"0 14px",
                    borderColor: s.hasLiked ? "var(--brand-500)" : "var(--line)",
                    background: s.hasLiked ? "#FFF5CC" : "var(--surface-2)"
                  }}>
                  {s.hasLiked ? `Unlike (${likeText})` : likeText}
                </button>
                <span className="lead" style={{ fontSize:"0.9rem" }}>{comments.length} comment{comments.length!==1?"s":""}</span>
              </div>

              {comments.length>0 && (
                <div className="stack-12">
                  {comments.map((c)=>(
                    <div key={c._id} className="panel" style={{ padding:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12 }}>
                        <strong>{displayName(c.createdBy as any)}</strong>
                        {c.createdAt && <span className="lead" style={{ fontSize:"0.85rem" }}>{formatDate(c.createdAt)}</span>}
                      </div>
                      <p style={{ marginTop:8 }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="stack-12">
                <label className="stack-12">
                  <span style={{ fontWeight:800 }}>Add a comment</span>
                  <textarea className="textarea" rows={3} value={draft}
                    onChange={(e)=> setCommentDrafts(prev=>({ ...prev, [s._id]: e.target.value })) }
                    placeholder="Share your thoughts..." />
                </label>
                <button type="button" onClick={()=>handleComment(s._id)} disabled={commentPending[s._id]} className="btn btn--primary" style={{ alignSelf:"flex-start" }}>
                  {commentPending[s._id] ? "Posting..." : "Comment"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
