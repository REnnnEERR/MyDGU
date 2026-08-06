import { LogoMark } from "./Logo";

const COLUMN_1 = [
  { label: "Курси", href: "#" },
  { label: "Про платформу", href: "#" },
  { label: "Питання та відповіді", href: "#" },
];

const COLUMN_2 = [
  { label: "Вхід", href: "#" },
  { label: "Новини", href: "#" },
];

const COLUMN_3 = [
  { label: "Політика cookies", href: "#" },
  { label: "Умови користування", href: "#" },
  { label: "Політика конфіденційності", href: "#" },
];

function FooterColumn({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            className="text-sm font-medium text-du-white/90 hover:text-du-white"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="bg-du-black text-du-white mt-auto">
      <div className="max-w-[1440px] mx-auto px-20 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <FooterColumn links={COLUMN_1} />
          <FooterColumn links={COLUMN_2} />
          <FooterColumn links={COLUMN_3} />
        </div>

        <div className="flex items-start gap-4 border-t border-white/10 pt-8">
          <LogoMark inverted />
          <div className="text-xs text-du-white/60 leading-relaxed max-w-2xl">
            <p>За фінансової підтримки Європейського Союзу.</p>
            <p>
              Висловлені погляди та думки є лише думками авторів і не
              обов&#x2019;язково відображають думки Європейського Союзу.
              Європейський Союз та орган, що надав грант, не несуть
              відповідальності за них.
            </p>
            <p className="mt-2">©2025 DigiUni. Всі права захищені.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
