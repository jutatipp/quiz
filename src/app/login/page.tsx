'use client';
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";
import type { StoredUser } from "@/lib/auth-storage";

interface SignInResponse {
  data:{ _id:string; firstname:string; lastname:string; email:string; image?:string; role?:string; type?:string; token:string; };
}

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, user } = useAuth();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState<string|null>(null);
  const [isSubmitting,setIsSubmitting]=useState(false);

  const handleSubmit = async (e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); setError(null); setSuccess(null);
    if(!email.trim() || !password.trim()){ setError("Please provide both email and password"); return; }
    setIsSubmitting(true);
    try{
      const res = await apiRequest<SignInResponse>({
        path:"/auth/signin", method:"POST", requiresAuth:false,
        body:{ email:email.trim(), password:password.trim() }
      });
      const sessionUser: StoredUser = {
        _id:res.data._id, firstname:res.data.firstname, lastname:res.data.lastname,
        email:res.data.email, image:res.data.image, role:res.data.role, type:res.data.type
      };
      login({ token:res.data.token, user:sessionUser });
      setSuccess("Signed in successfully. Redirecting...");
      router.push("/profile");
    }catch(err:any){
      setError(err?.message || "Unable to sign in. Please verify your credentials.");
    }finally{ setIsSubmitting(false); }
  };

  return (
    <section className="stack-24" style={{ minHeight:"calc(100vh - 120px)" }}>
      <header className="stack-12">
        <span className="badge">Sign in with your CIS account</span>
        <h1 className="h1">Sign in</h1>
        <p className="lead">Enter your CIS credentials to obtain an access token for the classroom services.</p>
      </header>

      <div className="card" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} className="stack-16">
          <label className="stack-12">
            <span style={{ fontWeight:800 }}>Email</span>
            <input className="input" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com"/>
          </label>
          <label className="stack-12">
            <span style={{ fontWeight:800 }}>Password</span>
            <input className="input" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="********"/>
          </label>

          {error && <p style={{ color:"#8A1F16", background:"#FFE9E6", border:"1px solid #FFD1CC", padding:"10px 12px", borderRadius:"12px", fontWeight:700 }}>{error}</p>}
          {success && <p style={{ color:"#14532d", background:"#E9FBE7", border:"1px solid #CFF5C9", padding:"10px 12px", borderRadius:"12px", fontWeight:700 }}>{success}</p>}

          <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {user && (
          <div className="panel" style={{ padding:16, marginTop:16 }}>
            <h2 style={{ fontSize:"1.05rem", marginBottom:8, fontWeight:800 }}>Current session</h2>
            <p>Signed in as {user.firstname} {user.lastname} ({user.email})</p>
            <p className="lead" style={{ fontSize:"0.95rem" }}>The access token is stored in your browser for subsequent API calls.</p>
            <button type="button" onClick={()=>{ logout(); setEmail(""); setPassword(""); }} className="btn btn--ghost" style={{ marginTop:12 }}>Sign out</button>
          </div>
        )}
      </div>
    </section>
  );
}
