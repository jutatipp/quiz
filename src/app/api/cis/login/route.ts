import { NextResponse } from "next/server";

// ====== CONFIG ======
const BASE = (process.env.CLASSROOM_API_BASE || "").replace(/\/+$/, "");
if (!BASE) throw new Error("CLASSROOM_API_BASE is not set");

const PATHS = (process.env.CLASSROOM_LOGIN_PATHS || "/ss/classroomapi/auth/login")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)
  .map(p => (p.startsWith("/") ? p : `/${p}`));

const FIELD_PAIRS = (process.env.CLASSROOM_LOGIN_FIELDS || "username,password;email,password;studentId,password;studentId,pwd")
  .split(";")
  .map(pair => pair.split(",").map(s => s.trim()))
  .filter(a => a.length === 2);

const API_KEY = process.env.CLASSROOM_API_KEY;
const BEARER = process.env.CLASSROOM_BEARER_TOKEN;
const SHOULD_LOG = process.env.LOG_UPSTREAM_DETAIL === "true";

// ====== HELPERS ======
function toFormUrlEncoded(obj: Record<string, string>) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function tryOnce(
  url: string,
  payload: Record<string, string>,
  mode: "json" | "form"
) {
  const headers: Record<string, string> = {};
  if (mode === "json") headers["Content-Type"] = "application/json";
  if (mode === "form") headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";

  if (API_KEY) headers["X-API-KEY"] = API_KEY;
  if (BEARER) headers["Authorization"] = `Bearer ${BEARER}`;

  const body = mode === "json" ? JSON.stringify(payload) : toFormUrlEncoded(payload);

  const res = await fetch(url, { method: "POST", headers, body, redirect: "follow" });
  const ct = res.headers.get("content-type") || "";
  let preview = "";
  try {
    preview = ct.includes("application/json")
      ? JSON.stringify(await res.clone().json()).slice(0, 400)
      : (await res.clone().text()).slice(0, 400);
  } catch { /* ignore */ }

  return {
    ok: res.ok,
    status: res.status,
    ct,
    res,
    preview,
    usedHeaders: Object.keys(headers),
    sentAs: mode,
  };
}

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) as { username?: string; password?: string };
    if (!username || !password) {
      return NextResponse.json({ error: true, code: 400, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }

    const attempts: Array<{
      url: string;
      status: number;
      ct: string;
      preview: string;
      usedHeaders: string[];
      sentAs: "json" | "form";
      fields: [string, string];
    }> = [];

    for (const path of PATHS) {
      // const url = `${BASE}${path}`;
      const url = `${BASE}/api/classroom/signin`;

      for (const [uField, pField] of FIELD_PAIRS) {
        const payload = { [uField]: String(username), [pField]: String(password) };

        // 1) ลอง JSON
        {
          const r = await tryOnce(url, payload, "json");
          attempts.push({ url, status: r.status, ct: r.ct, preview: r.preview, usedHeaders: r.usedHeaders, sentAs: "json", fields: [uField, pField] });
          if (r.ok && r.ct.includes("application/json")) {
            const data = await r.res.json();
            return NextResponse.json(data);
          }
          // ถ้าได้รับ 401/403 แบบ JSON → หยุดลูปเพื่อรายงานสิทธิ์
          if (!r.ok && (r.status === 401 || r.status === 403) && r.ct.includes("application/json")) {
            break;
          }
        }

        // 2) ลอง form-urlencoded
        {
          const r = await tryOnce(url, payload, "form");
          attempts.push({ url, status: r.status, ct: r.ct, preview: r.preview, usedHeaders: r.usedHeaders, sentAs: "form", fields: [uField, pField] });
          if (r.ok && r.ct.includes("application/json")) {
            const data = await r.res.json();
            return NextResponse.json(data);
          }
          if (!r.ok && (r.status === 401 || r.status === 403) && r.ct.includes("application/json")) {
            break;
          }
        }
      }
    }

    // ยังไม่เจอ endpoint ที่ถูก
    if (SHOULD_LOG) {
      console.error("[CIS Login Multi-Try Summary]",
        attempts.map(a => ({
          url: a.url,
          status: a.status,
          ct: a.ct,
          sentAs: a.sentAs,
          fields: a.fields,
          preview: a.preview
        }))
      );
    }

    const any404 = attempts.some(a => a.status === 404);
    const any401 = attempts.some(a => a.status === 401 || a.status === 403);
    const msg = any404
      ? "ไม่พบเส้นทางล็อกอินของ Classroom API (404) — โปรดตรวจสอบ CLASSROOM_API_BASE และ CLASSROOM_LOGIN_PATHS"
      : any401
      ? "ไม่ได้รับสิทธิ์เข้าถึง (401/403) — โปรดตรวจสอบ API KEY / Bearer Token"
      : "เข้าสู่ระบบไม่สำเร็จ — โปรดลองเปลี่ยน PATH/FIELD/PAYLOAD ใน .env.local หรือแจ้งผู้ดูแลระบบ";

    return NextResponse.json(
      { error: true, code: any404 ? 404 : any401 ? 401 : 502, message: msg, detail: SHOULD_LOG ? attempts.slice(0, 6) : undefined },
      { status: any404 ? 404 : any401 ? 401 : 502 }
    );
  } catch (err: any) {
    if (SHOULD_LOG) console.error("[CIS Login Proxy Error]", err?.message || err);
    return NextResponse.json({ error: true, code: 500, message: "Proxy error", detail: err?.message }, { status: 500 });
  }
}

// ตรวจ config แบบเร็ว ๆ
export async function GET() {
  return NextResponse.json({
    ok: true,
    info: {
      base: BASE,
      paths: PATHS,
      fieldPairs: FIELD_PAIRS,
      headerMode: API_KEY ? "X-API-KEY" : BEARER ? "Bearer" : "None",
      urlPreview: PATHS.map(p => `${BASE}${p}`)
    }
  });
}
