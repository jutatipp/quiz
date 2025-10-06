"use client";
import Protected from "../(protected)/Protected";
import { useEffect, useState } from "react";

export default function FeedPage() {
  return (
    <Protected>
      <FeedInner />
    </Protected>
  );
}

function FeedInner() {
  const [user, setUser] = useState<{ fullName?: string; username?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("appUser");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontWeight: 800, marginBottom: "1rem" }}>Feed</h1>
      {user ? (
        <>
          <p>สวัสดี <b>{user.fullName ?? user.username}</b> — เข้าสู่ระบบแล้ว 🎉</p>
          <div style={{ marginTop: 16 }}>
            <LogoutButton />
          </div>
        </>
      ) : (
        <p>กำลังตรวจสอบสถานะผู้ใช้…</p>
      )}
      <hr style={{ margin: "1.5rem 0" }} />
      <p>หน้านี้เป็น placeholder ทดสอบหลัง Login (จะต่อยอดฟีเจอร์โพสต์/คอมเมนต์ภายหลัง)</p>
    </main>
  );
}

function LogoutButton() {
  const onLogout = () => {
    localStorage.removeItem("appUser");
    localStorage.removeItem("appToken");
    window.location.href = "/login";
  };
  return (
    <button
      onClick={onLogout}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
