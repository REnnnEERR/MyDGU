'use client';
import { useState } from 'react';
import { roles } from '@/data/roles';
import { specialties } from '@/data/specialties';
import { ModuleBreadcrumb } from '@/components/Header';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [pib, setPib] = useState('Болтенков Іван Юрійович');
  const [myRoles, setMyRoles] = useState<string[]>(['викладач дисципліни з спеціальності']);
  const [mySpecs, setMySpecs] = useState<string[]>(['C4 Психологія', 'D9 Міжнародне право']);
  const [about, setAbout] = useState('Працюю над модернізацією освітніх рішень, розробляю інтерактивні курси.');

  const handleRoleChange = (role: string) => {
    setMyRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSpecChange = (specName: string) => {
    setMySpecs(prev => prev.includes(specName) ? prev.filter(s => s !== specName) : [...prev, specName]);
  };

  return (
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb current="Анкета автора/співавтора" />

      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        <div className="bg-du-white border border-du-gray-200 rounded-3xl p-7 relative">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-7 right-7 btn-pill btn-pill-outline text-sm py-1.5 px-4"
          >
            {isEditing ? '💾 Зберегти' : '✏️ Редагувати'}
          </button>

          <h1 className="text-2xl font-extrabold tracking-tight mb-7 pr-28">
            Анкета автора/співавтора курсу
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5">ПІБ</label>
              <input
                type="text"
                disabled={!isEditing}
                value={pib}
                onChange={e => setPib(e.target.value)}
                className="w-full p-2.5 border border-du-gray-200 rounded-xl disabled:bg-du-gray-50 font-medium focus:outline-none focus:border-du-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Ваша роль (можна декілька)</label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-du-gray-200 rounded-xl">
                  {roles.map(r => (
                    <label key={r} className="flex items-center gap-2 text-sm p-1 hover:bg-du-gray-50 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={myRoles.includes(r)} onChange={() => handleRoleChange(r)} /> {r}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {myRoles.map((r, i) => (
                    <span key={i} className="bg-du-yellow-soft text-du-gray-700 text-sm px-3 py-1 rounded-full font-medium">{r}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Вкажіть спеціальності, на яких ви викладаєте дисципліни</label>
              {isEditing ? (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-du-gray-200 rounded-xl">
                  {specialties.map(s => (
                    <label key={s.code} className="flex items-center gap-2 text-sm p-1 hover:bg-du-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mySpecs.includes(`${s.code} ${s.name}`)}
                        onChange={() => handleSpecChange(`${s.code} ${s.name}`)}
                      /> {s.code} {s.name}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mySpecs.map((s, i) => (
                    <span key={i} className="bg-du-lime-card text-du-gray-700 text-sm px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Коротко про себе</label>
              <textarea
                disabled={!isEditing}
                value={about}
                onChange={e => setAbout(e.target.value)}
                rows={4}
                className="w-full p-2.5 border border-du-gray-200 rounded-xl disabled:bg-du-gray-50 focus:outline-none focus:border-du-black"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}