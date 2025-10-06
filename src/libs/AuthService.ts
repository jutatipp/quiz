export interface AppUser {
  id?: number | string;
  username?: string;
  fullName?: string;
}

export default class AuthService {
  static async login(username: string, password: string) {
    const res = await fetch("/api/cis/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err?.message || `เข้าสู่ระบบไม่สำเร็จ (รหัส ${res.status})`);
      } catch {
        throw new Error(`เข้าสู่ระบบไม่สำเร็จ (รหัส ${res.status})`);
      }
    }

    const data = await res.json();
    const user: AppUser = data?.user || data?.student || data?.profile || { username };
    const token: string = data?.token || data?.accessToken || "";
    return { user, token };
  }
}
