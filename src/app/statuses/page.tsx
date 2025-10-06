'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";

interface ProfileData {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  image?: string;
  role?: string;
  type?: string;
  confirmed?: boolean;
  education?: {
    major?: string;
    enrollmentYear?: string;
    studentId?: string;
    school?: {
      _id?: string;
      name?: string;
      province?: string;
      logo?: string;
    };
    advisor?: {
      _id?: string;
      name?: string;
      email?: string;
      image?: string;
    };
    image?: string;
  };
  job?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileResponse {
  data: ProfileData;
}

const quickLinks = [
  {
    href: "/members",
    title: "Cohort directory",
    description: "Browse classmates filtered by enrollment year.",
  },
  {
    href: "/statuses",
    title: "Status board",
    description: "Post updates, comment, and react to classmates' statuses.",
  },
];

function normalizeProfile(data: ProfileData): ProfileData {
  return { ...data, education: data.education ?? {} };
}

export default function ProfilePage() {
  const router = useRouter();
  const { isReady, user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!profile) return "";
    return `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim();
  }, [profile]);

  useEffect(() => {
    if (isReady && !user) router.replace("/login");
  }, [isReady, user, router]);

  useEffect(() => {
    if (!isReady || !user) return;
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest<ProfileResponse>({ path: "/classroom/profile", method: "GET" });
        setProfile(normalizeProfile(response.data));
      } catch (e: any) {
        setError(e?.message ?? "Unable to load profile information");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [isReady, user]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!isReady) {
    return (
      <section className="section">
        <div className="container"><p>Loading session...</p></div>
      </section>
    );
  }
  if (!user) return null;

  return (
    <section className="section">
      <div className="container grid" style={{ gap: 20 }}>
        {/* Header */}
        <header className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {profile?.image ? (
              <Image src={profile.image} alt={displayName || "Profile photo"} width={72} height={72} style={{ borderRadius: 20, objectFit: "cover" }} />
            ) : (
              <div className="avatar avatar--lg" aria-hidden />
            )}
            <div>
              <p className="badge">Signed in via CIS</p>
              <h1 style={{ fontSize: "clamp(2rem, 4.8vw, 2.8rem)", lineHeight: 1.1, marginTop: 6 }}>
                {displayName || user.firstname}
              </h1>
              <p className="kicker">{profile?.email ?? user.email}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="btn btn--muted">Sign out</button>
        </header>

        {/* Quick links */}
        <div className="grid grid--cards">
          {quickLinks.map((card) => (
            <Link key={card.href} href={card.href} className="card" style={{ padding: 22 }}>
              <p className="badge">Quick access</p>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: 8 }}>{card.title}</h2>
              <p className="kicker" style={{ marginTop: 6 }}>{card.description}</p>
              <span className="btn btn--primary" style={{ marginTop: 14, width: "fit-content" }}>
                Go to {card.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Error/Loading */}
        {error && (
          <div className="card" style={{ padding: 16, color: "#8a1f16", fontWeight: 800 }}>{error}</div>
        )}
        {isLoading && <div className="card" style={{ padding: 16 }}>Loading profile details...</div>}

        {/* Details */}
        {profile && (
          <div className="grid grid--cards">
            <article className="card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Account</h2>
              <div style={{ marginTop: 10, lineHeight: 1.7 }}>
                {profile.role && <p><strong>Role:</strong> {profile.role}</p>}
                {profile.type && <p><strong>Program type:</strong> {profile.type}</p>}
                <p><strong>Verification:</strong> {profile.confirmed ? "Verified" : "Pending"}</p>
                {profile.createdAt && (
                  <p className="kicker">Member since {new Date(profile.createdAt).toLocaleDateString("th-TH")}</p>
                )}
              </div>
            </article>

            <article className="card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Education</h2>
              <div style={{ marginTop: 10, lineHeight: 1.7 }}>
                {profile.education?.major && <p><strong>Major:</strong> {profile.education.major}</p>}
                {profile.education?.enrollmentYear && <p><strong>Enrollment year:</strong> {profile.education.enrollmentYear}</p>}
                {profile.education?.studentId && <p><strong>Student ID:</strong> {profile.education.studentId}</p>}
                {profile.education?.school?.name && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                    {profile.education.school.logo ? (
                      <Image src={profile.education.school.logo} alt={profile.education.school.name ?? "School logo"} width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
                    ) : <div className="avatar" aria-hidden />}
                    <div>
                      <p><strong>School:</strong> {profile.education.school.name}</p>
                      {profile.education.school.province && <p className="kicker">{profile.education.school.province}</p>}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {profile.education?.advisor && (
              <article className="card" style={{ padding: 22 }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Advisor</h2>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 10 }}>
                  {profile.education.advisor.image ? (
                    <Image src={profile.education.advisor.image} alt={profile.education.advisor.name ?? "Advisor"} width={56} height={56} style={{ borderRadius: 16, objectFit: "cover" }} />
                  ) : <div className="avatar avatar--lg" aria-hidden />}
                  <div>
                    <p style={{ fontWeight: 800 }}>{profile.education.advisor.name}</p>
                    {profile.education.advisor.email && <p className="kicker">{profile.education.advisor.email}</p>}
                  </div>
                </div>
              </article>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
