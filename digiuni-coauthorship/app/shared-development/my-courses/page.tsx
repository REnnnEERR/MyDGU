'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ModuleBreadcrumb } from '@/components/Header';
import type { Course } from '@/types/course';

export default function MyCourses() {
  const [myCourses, setMyCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      // Імітуємо фільтр за автором (id: user_1 — це Іван Болтенков)
      .then((data: Course[]) => setMyCourses(data.filter(c => c.authorId === 'user_1')));
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb current="Мої курси" />

      <div className="max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Мої курси</h1>
          <Link href="/shared-development" className="text-sm font-medium text-du-blue hover:underline">
            ← Назад до каталогу
          </Link>
        </div>

        {myCourses.length === 0 ? (
          <p className="text-du-gray-500 italic py-10 text-center">У вас поки немає створених курсів.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {myCourses.map((course) => (
              <div key={course.id} className="p-6 bg-du-white rounded-3xl border border-du-gray-200 relative">
                <span
                  className={`absolute top-5 right-5 text-xs font-semibold px-3 py-1 rounded-full ${
                    course.status === 'Відкрито'
                      ? 'bg-du-lime-card text-du-gray-700'
                      : 'bg-du-gray-100 text-du-gray-500'
                  }`}
                >
                  {course.status}
                </span>
                <h3 className="text-xl font-bold mb-2 mt-2 pr-24">{course.title}</h3>
                <p className="text-du-gray-700 text-sm line-clamp-2 mb-4">{course.description}</p>
                <div className="text-xs text-du-gray-500 mb-5">
                  <strong className="text-du-gray-700">Спеціальність:</strong> {course.specialty}
                </div>

                <Link
                  href={`/shared-development/course/${course.id}`}
                  className="inline-block text-sm btn-pill btn-pill-outline py-2 px-4"
                >
                  Управління курсом ({course.applications.length} заявок)
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}