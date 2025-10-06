'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";

interface StatusAuthor { _id?: string; name?: string; email?: string; image?: string; }
interface StatusComment { _id: string; content: string; createdBy: string | StatusAuthor; like?: Array<string|StatusAuthor>; createdAt?: string; }
interface StatusItem {
  _id: string; content: string; createdBy: string | StatusAuthor;
  like?: Array<string|StatusAuthor>; likeCount?: number; hasLiked?: boolean;
  comment?: StatusComment[]; createdAt?: string; updatedAt?: string;
}
interface StatusListResponse { data: StatusItem[]; }
interface StatusMutationResponse { data: StatusItem; }

const displayName = (s: StatusItem["createdBy"]) => !s ? "Unknown" : (typeof s === "string" ? s : (s.name ?? s.email ?? "Unknown"));
const formatDate = (v?: string) => !v ? "" : new Date(v).toLocaleString("th-TH", { dateStyle:"medium", timeStyle:"short" });
const isOwned = (e: string|StatusAuthor|undefined, id?:string, email?:string) =>
  !!e && (typeof e === "string" ? (e===id || e===email) : (e._id===id || (!!email && e.email===email)));

function normalizeStatus(s: StatusItem, uid?: string, uemail?: string): StatusItem {
  const likeArr = s.like ?? [];
  const likeCount = typeof s.likeCount === "number" ? s.likeCount : likeArr.length;
  let hasLiked = s.hasLiked ?? likeArr.some(x => isOwned(x, uid, uemail));
  return { ...s, like: likeArr, likeCount, hasLiked, comment: s.comment ?? [] };
}

export default function StatusesPage() {
  const { isReady, user } = useAuth();
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentPending, setCommentPending] = useState<Record<string, boolean>>({});
  const [likePending, setLikePending] = useState<Record<string, boolean>>({});

  const uid = user?._id; const uemail = user?.email;
  const isAuth = useMemo(()=> isReady && Boolean(user), [isReady, user]);

  const refresh = useCallback(async () => {
    if (!isAuth) { setStatuses([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const res = await apiRequest<StatusListResponse>({ path: "/classroom/status", method:"GET" });
      setStatuses((res.data ?? []).map(x => normalizeStatus(x, uid, uemail)));
    } catch (e:any) {
      setError(e?.message ?? "Unable to load status feed");
    } finally { setIsLoading(false); }
  }, [isAuth, uid, uemail]);

  useEffect(()=> { void refresh(); }, [refresh]);

  const onPublish = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!composer.trim()) { setError("Please write something before publishing"); return; }
    setIsPublishing(true); setError(null);
    try {
      const res = await apiRequest<StatusMutationResponse>({
        path: "/classroom/status", method:"POST", body:{ content: composer.trim() }
      });
      if (!res.data) return void refresh();
      setStatuses(prev => [normalizeStatus(res.data, uid, uemail), ...prev]);
      setComposer("");
    } catch (e:any) {
      setError(e?.message ?? "Unable to publish status");
    } finally { setIsPublishing(false); }
  };

  const onComment = async (id: string) => {
    const draft = commentDrafts[id]?.trim(); if (!draft) return;
    setCommentPending(p=> ({...p, [id]: true})); setError(null);
    try {
      const res = await apiRequest<StatusMutationResponse>({
        path: "/classroom/comment", method:"POST", body:{ content: draft, statusId: id }
      });
      if (!res.data) return void refresh();
      const n = normalizeStatus(res.data, uid, uemail);
      setStatuses(prev => prev.map(x => x._id===id ? n : x));
      setCommentDrafts(prev => ({...prev, [id]: ""}));
    } catch (e:any) {
      setError(e?.message ?? "Unable to add comment");
    } finally { setCommentPending(p=> ({...p, [id]: false})); }
  };

  const toggleLike = async (s: StatusItem) => {
    const id = s._id, liked = !!s.hasLiked;
    setLikePending(p=> ({...p, [id]: true})); setError(null);
    // optimistic
    const optimistic = normalizeStatus({ ...s, hasLiked: !liked, likeCount: (s.likeCount ?? s.like?.length ?? 0) + (liked?-1:1) }, uid, uemail);
    setStatuses(prev => prev.map(x => x._id===id ? optimistic : x));
    try {
      const res = await apiRequest<StatusMutationResponse>({
        path: "/classroom/like", method:"POST", body:{ statusId: id, action: liked ? "unlike":"like" }
      });
      if (!res.data) return void refresh();
      setStatuses(prev => prev.map(x => x._id===id ? normalizeStatus(res.data, uid, uemail) : x));
    } catch (e:any) {
      setError(e?.message ?? "Unable to update like status");
      setStatuses(prev => prev.map(x => x._id===id ? s : x));
    } finally { setLikePending(p=> ({...p, [id]: false})); }
  };

  if (!isReady) return <section className="section"><div className="container"><p>Loading session...</p></div></section>;
  if (!user)
    return (
      <section className="section">
        <div className="container">
          <h1 style={{fontSize:"clamp(2rem, 4vw, 2.6rem)"}}>Status board</h1>
          <p className="kicker">Please sign in to view and interact with statuses.</p>
        </div>
      </section>
    );

 return (
  <section className="section">
    <div className="container grid" style={{gap:"20px"}}>
      <header>
        <p className="badge">Share updates with your cohort</p>
        <h1 style={{fontSize:"clamp(2.2rem,5vw,3rem)", marginTop:"6px"}}>Status board</h1>
        <p className="kicker">Post quick updates, discuss with classmates, and celebrate each other.</p>
      </header>

      <form onSubmit={onPublish} className="card" style={{padding:"16px"}}>
        <label className="grid" style={{gap:"8px"}}>
          <span style={{fontWeight:800}}>Create a status</span>
          <textarea className="textarea" value={composer} onChange={(e)=> setComposer(e.target.value)}
                    placeholder="Share something with your classmates..." rows={4}/>
        </label>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"10px"}}>
          <p className="kicker">Posting as {user.firstname} {user.lastname}</p>
          <button className="btn btn--primary" type="submit" disabled={isPublishing}>
            {isPublishing?"Publishing...":"Publish"}
          </button>
        </div>
      </form>

      {error && <div className="card" style={{padding:"14px", color:"#8a1f16", fontWeight:800}}>{error}</div>}
      {isLoading && <div className="card" style={{padding:"14px"}}>Loading feed...</div>}
      {!isLoading && statuses.length===0 && <p className="kicker">No statuses yet. Be the first!</p>}

      <ul className="grid" style={{gap:"16px"}}>
        {statuses.map(s=>{
          const comments=s.comment??[]; const likeText = s.likeCount?`${s.likeCount} like${s.likeCount>1?"s":""}`:"Be the first to like";
          const pending=likePending[s._id]; const draft=commentDrafts[s._id]??"";
          return (
            <li key={s._id} className="card" style={{padding:"18px"}}>
              <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                <div className="avatar" aria-hidden />
                <div>
                  <div style={{fontWeight:800}}>{displayName(s.createdBy)}</div>
                  {s.createdAt && <div className="kicker">{formatDate(s.createdAt)}</div>}
                </div>
              </div>

              <p style={{marginTop:"10px",fontSize:"1.02rem",lineHeight:1.6}}>{s.content}</p>

              <div style={{display:"flex",gap:"12px",alignItems:"center",marginTop:"10px"}}>
                <button type="button" className={`btn ${s.hasLiked?"btn--primary":"btn--muted"}`}
                        onClick={()=> toggleLike(s)} disabled={pending} aria-pressed={!!s.hasLiked}>
                  {s.hasLiked?`♥ Liked (${likeText})`:likeText}
                </button>
                <span className="kicker">{comments.length} comment{comments.length!==1?"s":""}</span>
              </div>

              {comments.length>0 && (
                <ul className="grid" style={{gap:"8px",marginTop:"10px"}}>
                  {comments.map(c=>(
                    <li key={c._id} className="card" style={{padding:"12px", background:"#fafafa"}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <strong>{displayName(c.createdBy as any)}</strong>
                        {c.createdAt && <span className="kicker">{formatDate(c.createdAt)}</span>}
                      </div>
                      <p style={{marginTop:"4px"}}>{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{borderTop:"1px solid var(--line)",marginTop:"12px",paddingTop:"12px"}} />
              <label className="grid" style={{gap:"8px"}}>
                <span style={{fontWeight:800}}>Add a comment</span>
                <textarea className="textarea" rows={3} placeholder="Share your thoughts..."
                          value={draft} onChange={(e)=> setCommentDrafts(p=>({...p,[s._id]:e.target.value}))}/>
              </label>
              <button type="button" className="btn btn--muted" onClick={()=> onComment(s._id)}
                      disabled={!!commentPending[s._id]} style={{marginTop:"8px"}}>
                {commentPending[s._id]?"Posting...":"Comment"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);

}
