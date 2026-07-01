import Link from "next/link";
import { DiamondPattern } from "@/components/DiamondPattern";

const MODULE_CARDS = [
  {
    title: "Каталог курсів у розробці",
    description:
      "Перегляньте курси, які зараз шукають співавторів. Фільтруйте за спеціальністю та потрібною роллю, щоб швидко знайти проєкт за вашим фахом.",
    cta: "До каталогу",
    href: "/shared-development",
  },
  {
    title: "Анкета автора/співавтора",
    description:
      "Вкажіть свою роль і спеціальності, на яких ви викладаєте дисципліни — так автори курсів зможуть знайти саме вас.",
    cta: "Заповнити анкету",
    href: "/shared-development/profile",
  },
  {
    title: "Створити власний курс",
    description:
      "Опишіть курс, оберіть спеціальність і позначте, які ролі співавторів вам потрібні — від графічного дизайнера до фахівця зі ШІ.",
    cta: "Створити курс",
    href: "/shared-development/course/new",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-du-yellow-soft via-du-yellow to-du-yellow-deep">
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <p className="text-sm font-semibold text-du-gray-700 mb-4">
            Новий модуль DigiUni
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl mb-6">
            Спільна розробка курсів — створюйте онлайн-освіту разом
          </h1>
          <p className="text-lg text-du-gray-700 max-w-xl mb-10">
            Знаходьте співавторів за роллю та спеціальністю, пропонуйте свою
            експертизу і створюйте сучасні курси для цифрового університету
            України.
          </p>
          {/* <div className="flex flex-wrap gap-4">
            <Link href="/shared-development" className="btn-pill btn-pill-black">
              Перейти до розробки курсів →
            </Link>
            <Link href="/shared-development/profile" className="btn-pill btn-pill-outline">
              Заповнити анкету
            </Link>
          </div> */}
        </div>

        <div className="hidden md:block absolute top-0 right-0 translate-x-12 -translate-y-6 z-0">
          <DiamondPattern />
        </div>
      </section>

      {/* Module sections overview */}
      <section className="bg-du-lime-bg">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight mb-10 max-w-xl">
            З чого почати роботу з модулем
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {MODULE_CARDS.map((card) => (
              <div
                key={card.title}
                className="bg-du-lime-card rounded-3xl p-7 flex flex-col"
              >
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-sm text-du-gray-700 leading-relaxed mb-6 flex-1">
                  {card.description}
                </p>
                <Link
                  href={card.href}
                  className="btn-pill bg-du-olive text-du-white text-sm py-2.5 px-5 self-start hover:opacity-90"
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}