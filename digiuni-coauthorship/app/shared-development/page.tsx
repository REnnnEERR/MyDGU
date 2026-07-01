'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { specialties } from '@/data/specialties';
import { roles } from '@/data/roles';
import { ModuleBreadcrumb } from '@/components/Header';
import type { Course } from '@/types/course';

export default function SharedDevelopment() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then((data: Course[]) => setCourses(data.filter(c => c.status === 'Відкрито')));
  }, []);

  const filteredCourses = courses.filter(course => {
    return (
      course.title.toLowerCase().includes(search.toLowerCase()) &&
      (selectedSpec === '' || course.specialty.includes(selectedSpec)) &&
      (selectedRole === '' || course.requiredRoles.includes(selectedRole))
    );
  });

  const activeFiltersCount = [search, selectedSpec, selectedRole].filter(Boolean).length;

  return (
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb current="Спільна розробка курсів" />

      <div className="max-w-6xl mx-auto w-full px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8">
          Спільна розробка курсів
        </h1>

        {/* Навігаційна панель дій */}
        <div className="flex flex-wrap gap-3 justify-between items-center mb-10 bg-du-gray-50 p-4 rounded-2xl border border-du-gray-200">
          <div className="flex flex-wrap gap-3">
            <Link href="/shared-development/my-courses" className="btn-pill btn-pill-outline text-sm py-2 px-4">
              📂 Мої курси
            </Link>
            <Link href="/shared-development/profile" className="btn-pill btn-pill-outline text-sm py-2 px-4">
              👤 Анкета автора/співавтора
            </Link>
            <button
              onClick={() => setShowFilter(true)}
              className="btn-pill btn-pill-outline text-sm py-2 px-4"
            >
              ⏳ Фільтри{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </button>
          </div>

          <Link href="/shared-development/course/new" className="btn-pill btn-pill-black text-sm py-2 px-5">
            ➕ Створити курс
          </Link>
        </div>

        {/* Список відкритих курсів */}
        <h2 className="text-xl font-bold text-du-gray-700 mb-4">Курси в пошуках співавтора</h2>

        {filteredCourses.length === 0 ? (
          <p className="text-du-gray-500 italic py-10 text-center">
            Курсів за цими критеріями не знайдено.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCourses.map((course) => (
              <Link
                href={`/shared-development/course/${course.id}`}
                key={course.id}
                className="block p-6 bg-du-white rounded-3xl border border-du-gray-200 hover:border-du-black transition"
              >
                <h3 className="text-xl font-bold text-du-black mb-2">{course.title}</h3>
                <p className="text-du-gray-700 text-sm line-clamp-2 mb-4">{course.description}</p>
                <div className="text-xs text-du-gray-500 mb-3">
                  <strong className="text-du-gray-700">Спеціальність:</strong> {course.specialty}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {course.requiredRoles.map((r, idx) => (
                    <span
                      key={idx}
                      className="bg-du-yellow-soft text-du-gray-700 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-xs text-right text-du-gray-500">Автор: {course.author}</div>
              </Link>
            ))}
          </div>
        )}

        {/* Модалка фільтрації */}
        {showFilter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-du-white p-6 rounded-3xl max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold mb-5">Налаштування фільтрів</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Пошук за назвою</label>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Введіть назву..."
                    className="w-full border border-du-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-du-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Спеціальність</label>
                  <select
                    value={selectedSpec}
                    onChange={e => setSelectedSpec(e.target.value)}
                    className="w-full border border-du-gray-200 p-2.5 rounded-xl text-sm bg-du-white focus:outline-none focus:border-du-black"
                  >
                    <option value="">Усі спеціальності</option>
                    {specialties.map(s => (
                      <option key={s.code} value={s.name}>{s.code} {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Роль співавтора</label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="w-full border border-du-gray-200 p-2.5 rounded-xl text-sm bg-du-white focus:outline-none focus:border-du-black"
                  >
                    <option value="">Усі ролі</option>
                    {roles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-7 flex justify-end gap-2">
                <button
                  onClick={() => { setSearch(''); setSelectedSpec(''); setSelectedRole(''); }}
                  className="px-4 py-2 text-du-gray-500 hover:text-du-black text-sm font-medium"
                >
                  Скинути
                </button>
                <button onClick={() => setShowFilter(false)} className="btn-pill btn-pill-black text-sm py-2 px-5">
                  Застосувати
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}