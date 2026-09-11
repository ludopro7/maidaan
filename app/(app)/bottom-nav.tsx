"use client";

import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/cricket", label: "Cricket" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        borderTop: "1px solid var(--pitch-700)",
        background: "var(--pitch-950)",
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "14px 0",
              fontSize: 12,
              color: active ? "var(--ball-500)" : "var(--chalk-300)",
              fontWeight: active ? 700 : 400,
            }}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
