"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { LogoMark } from "../Logo/Logo";
import { api, useAuth } from "@/context/AuthContext";
import { GlobeIcon } from "@/components/icons/icons";
import type { Profile } from "@/types/course";
import styles from "./Header.module.css";

type Conversation = { unreadCount: number };

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
  const [displayName, setDisplayName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDisplayName = useCallback(() => {
    if (!user) {
      setDisplayName("");
      return;
    }
    setDisplayName(user.email ? user.email.split("@")[0] : "");
    api
      .get<Profile | null>("/api/profile/me")
      .then((profile) => {
        if (profile?.fullName) setDisplayName(profile.fullName);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    loadDisplayName();
  }, [loadDisplayName]);

  useEffect(() => {
    window.addEventListener("profile-updated", loadDisplayName);
    return () => window.removeEventListener("profile-updated", loadDisplayName);
  }, [loadDisplayName]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    api
      .get<Conversation[]>("/api/messages/conversations")
      .then((list) =>
        setUnreadCount(list.reduce((sum, c) => sum + c.unreadCount, 0)),
      )
      .catch(() => {});
  }, [user, menuOpen]);

  return (
    <header>
      <div className={styles.container}>
        <div className={styles.brandNav}>
          <Link href="/" className={styles.logoLink}>
            <LogoMark />
            <span className={styles.logoText}>DIGIUNI</span>
          </Link>

          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className={styles.rightSide}>
          <span className={styles.globalVersion}>
            <GlobeIcon className="w-4 h-4" /> Global version
          </span>

          {isLoading ? null : user ? (
            <div className={styles.profileWrapper} ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`${styles.profileButton} btn-pill btn-pill-outline text-sm py-2 px-5`}
              >
                {displayName || "Профіль"}
                {unreadCount > 0 && <span className={styles.unreadDot} />}
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <a href="#" className={styles.dropdownItem}>
                    Перейти в Moodle
                  </a>
                  <div className={styles.dropdownDivider} />
                  <Link
                    href="/shared-development"
                    onClick={() => setMenuOpen(false)}
                    className={styles.dropdownItem}
                  >
                    Спільна розробка
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <a href="#" className={styles.dropdownItem}>
                    Моє портфоліо
                  </a>
                  <div className={styles.dropdownDivider} />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className={styles.dropdownItem}
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
    <div className={styles.breadcrumb}>
      <Link href="/" className={styles.breadcrumbLink}>
        Головна
      </Link>
      {items.map((item, i) => (
        <span key={i} className={styles.breadcrumbSegment}>
          <span>|</span>
          {item.href ? (
            <Link href={item.href} className={styles.breadcrumbLink}>
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
