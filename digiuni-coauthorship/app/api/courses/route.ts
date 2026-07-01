import { NextResponse } from 'next/server';
import type { Course } from '@/types/course';

// Тимчасове сховище в пам'яті сервера (скидається при перезапуску, але ідеально для презентації)
let globalCourses: Course[] = [
  {
    id: "1",
    title: "Основи психології спілкування",
    description: "Короткий курс про практичну психологію для студентів різних спеціальностей.",
    specialty: "C4 Психологія",
    requiredRoles: ["графічний дизайнер", "фахівець зі штучного інтелекту"],
    status: "Відкрито",
    author: "Болтенков Іван Юрійович",
    authorId: "user_1",
    applications: [
      { id: "a1", userName: "Петро Петренко", role: "графічний дизайнер", status: "очікує" }
    ]
  },
  {
    id: "2",
    title: "Міжнародне право в епоху ШІ",
    description: "Курс про юридичні аспекти використання штучного інтелекту.",
    specialty: "D9 Міжнародне право",
    requiredRoles: ["фахівець зі штучного інтелекту", "відеомейкер"],
    status: "Відкрито",
    author: "Наталія Бацак",
    authorId: "user_2",
    applications: []
  }
];

export async function GET() {
  return NextResponse.json(globalCourses);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCourse: Course = {
    id: String(globalCourses.length + 1),
    status: "Відкрито",
    author: "Болтенков Іван Юрійович", // Імітуємо авторизованого юзера для демо
    authorId: "user_1",
    applications: [],
    ...body
  };
  globalCourses.push(newCourse);
  return NextResponse.json(newCourse);
}