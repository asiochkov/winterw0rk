import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBack } from '../../hooks/useBack';
import { api } from '../../api/client';
import type { ExerciseListItem } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { ErrorState, LoadingRows } from '../../components/states';
import { useAsyncData } from '../../hooks/useAsyncData';
import { EmptyState, Input } from '../../components/ui';
import '../training.css';

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const back = useBack('/training');
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  /*
   * Both of these were bare .then() with no rejection handler, so a failed
   * request left an empty library that read as "there are no exercises".
   */
  const groupState = useAsyncData(() => api.get<{ groups: string[] }>('/exercises/groups'), []);
  const groups = groupState.data?.groups ?? [];

  const listState = useAsyncData(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (group) params.set('group', group);
    return api.get<{ exercises: ExerciseListItem[] }>(`/exercises?${params}`);
  }, [q, group]);
  const exercises = listState.data?.exercises ?? null;

  return (
    <Screen title={t('libraryTitle')} nav={false} back={back}>
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

      {listState.error ? (
        <ErrorState message={listState.error} onRetry={listState.reload} retryLabel={t('tryAgain')} />
      ) : listState.loading ? (
        <LoadingRows rows={5} />
      ) : exercises && exercises.length === 0 ? (
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
