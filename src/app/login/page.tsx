'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";
import type { StoredUser } from "@/lib/auth-storage";

interface SignInResponse {
  data: {
    _id: string; firstname: string; lastname: string; email: string;
    image?: string; role?: string; type?: string; token: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, user } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); setSuccess(null);
    if (!email.trim() || !password.trim()) { setError("Please provide both email and password"); return; }
    setIsSubmitting(true);
    try {
      const res = await apiRequest<SignInResponse>({ path: "/auth/signin", method: "POST", requiresAuth: false, body: { email: email.trim(), password: password.trim() } });
      const sessionUser: StoredUser = { _id: res.data._id, firstname: res.data.firstname, lastname: res.data.lastname, email: res.data.email, image: res.data.image, role: res.data.role, type: res.data.type };
      login({ token: res.data.token, user: sessionUser });
      setSuccess("Signed in successfully. Redirecting to profile...");
      router.push("/profile");
    } catch (e:any) { setError(e?.message ?? "Unable to sign in. Please verify your credentials."); }
    finally { setIsSubmitting(false); }
  };

  const handleLogout = () => { logout(); setEmail(""); setPassword(""); setSuccess("You have been signed out."); };

  return (
    <section className="section" style={{minHeight:"65vh", display:"grid", placeItems:"center",
      background:"linear-gradient(135deg,#fff 0%,#f8f8fb 50%,#fcf7e2 100%)"}}>
      <div className="card glass" style={{width:"min(480px,100%)", padding:"28px"}}>
        <p className="badge">Sign in with your CIS account</p>
        <h1 style={{fontSize:"clamp(1.9rem,4vw,2.4rem)", margin:"10px 0 6px"}}>Sign in</h1>
        <p className="kicker" style={{marginBottom:"16px"}}>Enter your CIS credentials to access classroom services.</p>

        <form onSubmit={handleSubmit} className="grid" style={{gap:"14px"}}>
          <label className="grid" style={{gap:"6px"}}>
            <span style={{fontWeight:800}}>Email</span>
            <input className="input" type="email" required value={email}
              onChange={(e)=> setEmail(e.target.value)} placeholder="user@example.com" autoComplete="email"/>
          </label>
          <label className="grid" style={{gap:"6px"}}>
            <span style={{fontWeight:800}}>Password</span>
            <input className="input" type="password" required value={password}
              onChange={(e)=> setPassword(e.target.value)} placeholder="********" autoComplete="current-password"/>
          </label>

          {error && <p style={{color:"#8a1f16", fontWeight:800}}>{error}</p>}
          {success && <p style={{color:"#106a36", fontWeight:800}}>{success}</p>}

          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {user && (
          <div className="card" style={{marginTop:"18px", padding:"16px"}}>
            <h2 style={{fontSize:"1.05rem", fontWeight:800, marginBottom:"8px"}}>Current session</h2>
            <p>Signed in as {user.firstname} {user.lastname} ({user.email})</p>
            <button type="button" onClick={handleLogout} className="btn btn--muted" style={{marginTop:"12px"}}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
