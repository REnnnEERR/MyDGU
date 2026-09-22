import { LogoMark } from "../Logo/Logo";
import styles from "./Footer.module.css";

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
    <ul className={styles.columnList}>
      {links.map((link) => (
        <li key={link.label}>
          <a href={link.href} className={styles.columnLink}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columns}>
          <FooterColumn links={COLUMN_1} />
          <FooterColumn links={COLUMN_2} />
          <FooterColumn links={COLUMN_3} />
        </div>

        <div className={styles.bottom}>
          <LogoMark inverted />
          <div className={styles.bottomText}>
            <p>За фінансової підтримки Європейського Союзу.</p>
            <p>
              Висловлені погляди та думки є лише думками авторів і не
              обов&#x2019;язково відображають думки Європейського Союзу.
              Європейський Союз та орган, що надав грант, не несуть
              відповідальності за них.
            </p>
            <p className={styles.bottomTextSpacer}>
              ©2025 DigiUni. Всі права захищені.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
