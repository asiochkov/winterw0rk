import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { ExerciseListItem } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { EmptyState, Input } from '../../components/ui';
import '../training.css';

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<ExerciseListItem[] | null>(null);

  useEffect(() => {
    api.get<{ groups: string[] }>('/exercises/groups').then((r) => setGroups(r.groups));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (group) params.set('group', group);
    api.get<{ exercises: ExerciseListItem[] }>(`/exercises?${params}`).then((r) => setExercises(r.exercises));
  }, [q, group]);

  return (
    <Screen title={t('libraryTitle')} nav={false}>
      <button className="auth-back" onClick={() => navigate('/training')} style={{ marginBottom: 16 }}>
        ← {t('trainingTitle')}
      </button>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('librarySearch')} style={{ marginBottom: 12 }} />
      <div className="mood-chip-list" style={{ marginBottom: 16 }}>
        <button className={`quit-chip ${!group ? 'quit-chip-on' : ''}`} onClick={() => setGroup('')}>
          {t('all')}
        </button>
        {groups.map((g) => (
          <button key={g} className={`quit-chip ${group === g ? 'quit-chip-on' : ''}`} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>

      {exercises && exercises.length === 0 ? (
        <EmptyState
          title={t('libraryEmptyTitle')}
          body={t('libraryEmptyBody')}
          action={
            <button
              className="today-link"
              onClick={() => {
                setQ('');
                setGroup('');
              }}
            >
              {t('libraryReset')}
            </button>
          }
        />
      ) : (
        <div className="tr-list">
          {(exercises || []).map((ex) => (
            <button key={ex.id} className="tr-row" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => navigate(`/training/exercises/${ex.id}`)}>
              <div>
                <p className="tr-name">{ex.name}</p>
                <p className="tr-meta">{ex.group} · {ex.equipment}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}
