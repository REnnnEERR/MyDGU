import { LogoMark } from "../Logo/Logo";
import styles from "./Footer.module.css";

const COLUMN_1 = [
  { label: "Новини", href: "#" },
  { label: "Як це працює", href: "#" },
  { label: "Команда проєкту", href: "#" },
];

const COLUMN_2 = [
  { label: "Питання та відповіді", href: "#" },
  { label: "Підтримка", href: "#" },
  { label: "Репозитарій", href: "#" },
];

const COLUMN_3 = [
  { label: "Увійти", href: "/login" },
  { label: "Зареєструватись", href: "/register" },
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

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 9H16V6h-2.5C11.57 6 10 7.57 10 9.5V11H8v3h2v7h3v-7h2.5l.5-3H13v-1.5c0-.28.22-.5.5-.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7.1l4.9 6.4L18.9 2zm-1.2 18h1.9L7.4 4H5.3l12.4 16z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 3.5L2.7 10.9c-1.1.44-1.1 1.86.02 2.28l4.6 1.65 1.8 5.63c.2.62 1 .8 1.47.33l2.52-2.5 4.78 3.52c.78.57 1.9.15 2.1-.79L23.9 5.1c.25-1.2-.98-2.1-2.4-1.6zM8.9 14.4l-1.1-3.6 10.2-6.4-9.1 10z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columnsRow}>
          <FooterColumn links={COLUMN_1} />
          <FooterColumn links={COLUMN_2} />
          <FooterColumn links={COLUMN_3} />

          <div className={styles.socialColumn}>
            <span className={styles.socialLabel}>Слідкуй за нами тут:</span>
            <div className={styles.socialIcons}>
              <a
                href="#"
                aria-label="Facebook"
                className={styles.socialIconButton}
              >
                <FacebookIcon />
              </a>
              <a href="#" aria-label="X" className={styles.socialIconButton}>
                <XIcon />
              </a>
              <a
                href="#"
                aria-label="Telegram"
                className={styles.socialIconButton}
              >
                <TelegramIcon />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className={styles.socialIconButton}
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <LogoMark inverted />
          <div className={styles.bottomText}>
            <p>©2025 Funded by the European Union.</p>
            <p>
              Views and opinions expressed are however those of the author(s)
              only and do not necessarily reflect those of the European Union.
              Neither the European Union nor the granting authority can be held
              responsible for them.
            </p>
            <p>Всі права захищені.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
