import Link from "next/link";
import { LogoMark } from "./Logo";

const NAV_LINKS = [
  { label: "Курси", href: "#" },
  { label: "Про платформу", href: "#" },
  { label: "Новини", href: "#" },
  { label: "Питання та відповіді", href: "#" },
];

export function Header() {
  return (
    <header className="border-b border-du-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight">DIGIUNI</span>
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

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-du-gray-700">
            🌐 Global version
          </span>
          <Link href="/shared-development" className="btn-pill btn-pill-black text-sm py-2 px-5">
            Спільна розробка курсів
          </Link>
          <a href="#" className="btn-pill btn-pill-outline text-sm py-2 px-5">
            Вихід
          </a>
        </div>
      </div>
    </header>
  );
}

export function ModuleBreadcrumb({ current }: { current: string }) {
  return (
    <div className="bg-du-gray-50 border-b border-du-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-2.5 text-sm text-du-gray-500 flex items-center gap-2">
        <span className="font-medium text-du-gray-700">DigiUni</span>
        <span>/</span>
        <span>{current}</span>
      </div>
    </div>
  );
}