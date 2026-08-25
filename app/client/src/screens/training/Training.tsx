import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { WorkoutSession } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, EmptyState, Section } from '../../components/ui';
import '../training.css';

export default function Training() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [restDay, setRestDay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ session: WorkoutSession | null; restDay: boolean }>('/training/today')
      .then((r) => {
        setSession(r.session);
        setRestDay(r.restDay);
      })
      .finally(() => setLoading(false));
  }, []);

  async function start() {
    if (!session) return;
    const r = await api.post<{ session: WorkoutSession }>(`/training/sessions/${session.id}/start`);
    navigate(`/training/session/${r.session.id}`);
  }

  if (loading) return <Screen title={t('trainingTitle')} nav>{null}</Screen>;

  if (restDay || !session) {
    return (
      <Screen title={t('trainingTitle')} nav>
        <EmptyState title={t('trainingRestDayTitle')} body={t('trainingRestDayBody')} />
        <button className="today-link" style={{ display: 'block', margin: '16px auto 0' }} onClick={() => navigate('/training/library')}>
          {t('trainingBrowseLibrary')}
        </button>
      </Screen>
    );
  }

  if (session.status === 'completed') {
    return (
      <Screen title={t('trainingTitle')} nav>
        <EmptyState
          title={t('trainingDoneTitle', { name: session.name })}
          body={t('trainingDoneBody')}
          action={
            <Button full variant="secondary" onClick={() => navigate(`/training/session/${session.id}/summary`)}>
              {t('trainingViewSummary')}
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen kicker={t('trainingToday')} title={session.name} nav>
      <Section title={t('trainingExercisesCount', { n: session.exercises.length })}>
        <div className="tr-list">
          {session.exercises.map((ex) => (
            <div key={ex.sessionExerciseId} className="tr-row">
              <div>
                <p className="tr-name">{ex.name}</p>
                <p className="tr-meta">{ex.group} · {ex.equipment}</p>
              </div>
              {ex.previous && (
                <span className="tr-prev">
                  {ex.previous.weight}kg × {ex.previous.reps}
                </span>
              )}
            </div>
          ))}
        </div>
      </Section>
      <Button full onClick={session.status === 'active' ? () => navigate(`/training/session/${session.id}`) : start}>
        {session.status === 'active' ? t('trainingResume') : t('trainingStart')}
      </Button>
      <button className="today-link" style={{ display: 'block', margin: '16px auto 0' }} onClick={() => navigate('/training/library')}>
        {t('trainingBrowseLibrary')}
      </button>
    </Screen>
  );
}
