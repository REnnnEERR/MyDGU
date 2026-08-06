"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";
import { useAuth } from "@/context/AuthContext";
import { GlobeIcon } from "@/components/icons";

const NAV_LINKS = [
  { label: "Курси", href: "#" },
  { label: "Про платформу", href: "#" },
  { label: "Новини", href: "#" },
  { label: "Питання та відповіді", href: "#" },
];

export function Header() {
  const { user, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header>
      <div className="max-w-[1440px] mx-auto px-20 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight">
              DIGIUNI
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-du-black hover:text-du-blue transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-du-gray-700">
            <GlobeIcon className="w-4 h-4" /> Global version
          </span>

          {isLoading ? null : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="btn-pill btn-pill-outline text-sm py-2 px-5"
              >
                {user.email ? user.email.split("@")[0] : "Профіль"}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[185px] h-[166px] bg-du-white shadow-lg border border-du-gray-200 flex flex-col z-50">
                  <a
                    href="#"
                    className="flex-1 flex items-center px-4 text-sm font-medium text-du-black hover:bg-du-gray-50"
                  >
                    Перейти в Moodle
                  </a>
                  <div className="w-[169px] h-[2px] bg-du-gray-200 mx-auto shrink-0" />
                  <Link
                    href="/shared-development"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center px-4 text-sm font-medium text-du-black hover:bg-du-gray-50"
                  >
                    Спільна розробка
                  </Link>
                  <div className="w-[169px] h-[2px] bg-du-gray-200 mx-auto shrink-0" />
                  <a
                    href="#"
                    className="flex-1 flex items-center px-4 text-sm font-medium text-du-black hover:bg-du-gray-50"
                  >
                    Моє портфоліо
                  </a>
                  <div className="w-[169px] h-[2px] bg-du-gray-200 mx-auto shrink-0" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex-1 flex items-center text-left px-4 text-sm font-medium text-du-black hover:bg-du-gray-50"
                  >
                    Вийти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-pill btn-pill-outline text-sm py-2 px-5"
            >
              Вхід
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export type BreadcrumbItem = { label: string; href?: string };

export function ModuleBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="max-w-[1440px] mx-auto w-full px-20 pt-6 text-sm text-du-gray-500 flex items-center gap-2 flex-wrap">
      <Link href="/" className="hover:text-du-black">
        Головна
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>|</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-du-black">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
