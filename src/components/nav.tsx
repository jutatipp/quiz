'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname() || "";
  const is = (x: string) =>
    pathname === x || pathname.startsWith(x + "/")
      ? ({ "aria-current": "page" as const })
      : ({});

  return (
    <div className="nav" role="navigation" aria-label="Main">
      <div className="nav__pill">
        <Link href="/profile" {...is("/profile")}>โปรไฟล์</Link>
        <Link href="/members" {...is("/members")}>นักศึกษา</Link>
        <Link href="/statuses" {...is("/statuses")}>ฟีด</Link>
      </div>
      <div className="nav__icon" title="ตั้งค่า">⚙️</div>
    </div>
  );
}
