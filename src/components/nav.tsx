"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar(){
  const pathname = usePathname();
  const is = (p:string)=> (pathname?.startsWith(p) ? "page" : undefined);

  return (
    <header className="nav">
      <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <Link href="/profile" className="nav__brand">KKU Classroom</Link>

        <nav className="only-desktop" style={{display:"flex",gap:8}}>
          <Link className="nav__link" aria-current={is("/profile")}  href="/profile">โปรไฟล์</Link>
          <Link className="nav__link" aria-current={is("/members")}  href="/members">สมาชิก</Link>
          <Link className="nav__link" aria-current={is("/statuses")} href="/statuses">สถานะ</Link>
        </nav>

        <div className="only-mobile" style={{minWidth:160}}>
          <select className="input" defaultValue="/profile" onChange={(e)=>location.href=e.target.value}>
            <option value="/profile">โปรไฟล์</option>
            <option value="/members">สมาชิก</option>
            <option value="/statuses">สถานะ</option>
          </select>
        </div>
      </div>
    </header>
  );
}
