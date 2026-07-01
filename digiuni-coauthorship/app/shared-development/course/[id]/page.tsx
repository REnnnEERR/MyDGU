'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { specialties } from '@/data/specialties';
import { roles } from '@/data/roles';
import { ModuleBreadcrumb } from '@/components/Header';
import type { CourseApplication } from '@/types/course';

export default function CourseFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === 'new';
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(isNew);
  const [isAuthor, setIsAuthor] = useState(true); // Для демонстрації перемикаємо вручну нижче
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [applications, setApplications] = useState<CourseApplication[]>([]);

  useEffect(() => {
    if (!isNew) {
      fetch('/api/courses')
        .then(res => res.json())
        .then(data => {
          const found = data.find((c: { id: string }) => c.id === resolvedParams.id);
          if (found) {
            setTitle(found.title);
            setDescription(found.description);
            setSpecialty(found.specialty);
            setRequiredRoles(found.requiredRoles);
            setApplications(found.applications);
            // Для тесту: якщо id=2, зробимо вигляд, що ми не автор
            if (found.id === '2') setIsAuthor(false);
          }
        });
    }
  }, [resolvedParams.id, isNew]);

  const handleRoleToggle = (role: string) => {
    setRequiredRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSave = async () => {
    if (isNew) {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, specialty, requiredRoles })
      });
      router.push('/shared-development');
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb current={isNew ? 'Створення курсу' : `Курс: ${title || '...'}`} />

      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-du-white border border-du-gray-200 rounded-3xl p-7 relative">
          {!isNew && isAuthor && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-7 right-7 btn-pill btn-pill-outline text-sm py-1.5 px-4"
            >
              {isEditing ? '💾 Скасувати' : '✏️ Редагувати'}
            </button>
          )}

          {/* Перемикач для демонстрації презентації замовнику */}
          {!isNew && (
            <div className="mb-5 p-2.5 bg-du-yellow-soft rounded-xl text-xs text-du-gray-700 flex gap-4">
              <span className="font-semibold">Режим демонстрації:</span>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={isAuthor} onChange={e => setIsAuthor(e.target.checked)} /> Я Автор курсу
              </label>
            </div>
          )}

          <h1 className="text-2xl font-extrabold tracking-tight mb-7 pr-32">
            {isNew ? 'Створення спільного курсу' : `Курс: ${title}`}
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Назва курсу</label>
              <input
                type="text"
                disabled={!isEditing}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Наприклад: Біологія"
                className="w-full p-2.5 border border-du-gray-200 rounded-xl disabled:bg-du-gray-50 focus:outline-none focus:border-du-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Опис курсу</label>
              <textarea
                disabled={!isEditing}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Короткий опис цілей та задач курсу..."
                className="w-full p-2.5 border border-du-gray-200 rounded-xl disabled:bg-du-gray-50 focus:outline-none focus:border-du-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Спеціальність</label>
              {isEditing ? (
                <select
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="w-full p-2.5 border border-du-gray-200 rounded-xl focus:outline-none focus:border-du-black"
                >
                  <option value="">Оберіть спеціальність...</option>
                  {specialties.map(s => (
                    <option key={s.code} value={`${s.code} ${s.name}`}>{s.code} {s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-du-gray-50 border border-du-gray-200 rounded-xl text-du-gray-700">
                  {specialty || 'Не вказано'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Потрібні співавтори з ролями</label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-du-gray-200 rounded-xl">
                  {roles.map(r => (
                    <label key={r} className="flex items-center gap-2 text-sm p-1 hover:bg-du-gray-50 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={requiredRoles.includes(r)} onChange={() => handleRoleToggle(r)} /> {r}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {requiredRoles.map((r, i) => (
                    <span key={i} className="bg-du-yellow-soft text-du-gray-700 text-sm px-3 py-1 rounded-full font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={!title || !specialty}
                className="w-full btn-pill btn-pill-black py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isNew ? '🚀 Створити і запустити пошук' : '💾 Зберегти зміни'}
              </button>
            )}

            {/* Специфічний функціонал залежно від ролі користувача (Автор / Гість) */}
            {!isEditing && (
              <div className="border-t border-du-gray-200 pt-6 mt-6">
                {isAuthor ? (
                  <div>
                    <h3 className="text-lg font-bold mb-3">Заявки на долучення до курсу</h3>
                    {applications.length === 0 ? (
                      <p className="text-sm text-du-gray-500 italic">Поки що немає жодної заявки від співавторів.</p>
                    ) : (
                      <div className="space-y-3">
                        {applications.map(app => (
                          <div key={app.id} className="flex justify-between items-center p-3 bg-du-gray-50 border border-du-gray-200 rounded-xl">
                            <div>
                              <div className="font-semibold">{app.userName}</div>
                              <div className="text-xs text-du-blue font-medium">Роль: {app.role}</div>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-du-olive text-du-white text-xs rounded-full hover:opacity-90">
                                Підтвердити
                              </button>
                              <button className="px-3 py-1 bg-du-gray-200 text-du-gray-700 text-xs rounded-full hover:bg-du-gray-300">
                                Відхилити
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-du-yellow-soft p-5 rounded-2xl">
                    <h3 className="font-bold mb-2">Бажаєте стати співавтором?</h3>
                    <p className="text-sm text-du-gray-700 mb-4">
                      Оберіть одну з доступних ролей, які шукає автор, та надішліть свій запит.
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                      <select className="p-2 border border-du-gray-200 rounded-xl text-sm bg-du-white">
                        <option value="">Оберіть роль...</option>
                        {requiredRoles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                      </select>
                      <button
                        onClick={() => alert('Заявку успішно надіслано автору!')}
                        className="btn-pill btn-pill-black text-sm py-2 px-5"
                      >
                        Подати себе як співавтора
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}