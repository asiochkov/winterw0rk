import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { WorkoutSession } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { ScreenHead } from '../../components/ScreenHead';
import { ErrorState, LoadingRows } from '../../components/states';
import '../training.css';

export default function Training() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [restDay, setRestDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api.get<{ session: WorkoutSession | null; restDay: boolean }>('/training/today');
      setSession(r.session);
      setRestDay(r.restDay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load training.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function start() {
    if (!session) return;
    const r = await api.post<{ session: WorkoutSession }>(`/training/sessions/${session.id}/start`);
    navigate(`/training/session/${r.session.id}`);
  }

  const head = <ScreenHead chip={t('trainingMovement')} title={t('trainingTitle')} />;

  if (loading) {
    return (
      <Screen nav>
        <LoadingRows rows={4} />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen nav>
        <ErrorState message={error} onRetry={load} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }

  if (restDay || !session) {
    return (
      <Screen nav bleed>
        {head}
        <div className="tr-body">
          <div className="tr-rest">
            <div className="tr-rest-title">{t('trainingRestDayTitle')}</div>
            <p className="tr-rest-body">{t('trainingRestDayBody')}</p>
            <button type="button" className="today-link" onClick={() => navigate('/training/library')}>
              {t('trainingBrowseLibrary')}
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  const done = session.status === 'completed';
  // v6 states the session in three numbers before anything else on the card.
  // Sets are the ones actually on the session; a planned session that has not
  // been opened yet has none, and three per exercise is the shape the seeded
  // plans use, so the count stays truthful rather than reading zero.
  const loggedSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const totalSets = loggedSets || session.exercises.length * 3;
  const metrics = [
    { value: String(session.exercises.length), label: t('trainingMetricExercises') },
    { value: String(totalSets), label: t('trainingMetricSets') },
    // Roughly three minutes a set including rest, which is what v6 quotes.
    { value: t('trainingMetricMinutes', { n: totalSets * 3 }), label: t('trainingMetricDuration') },
  ];

  return (
    <Screen nav bleed>
      {head}

      <div className="tr-body">
        <div className="tr-card">
          <div className="tr-card-top">
            <span className="tr-card-day">{t('trainingToday')}</span>
            <span className="tr-card-place">{session.exercises[0]?.equipment ?? ''}</span>
          </div>
          <div className="tr-card-name">{session.name}</div>

          <div className="tr-metrics">
            {metrics.map((m) => (
              <div key={m.label} className="tr-metric">
                <div className="tr-metric-v">{m.value}</div>
                <div className="tr-metric-l">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="tr-purpose">{t('trainingPurpose')}</div>

          <button
            type="button"
            className="tr-start"
            onClick={done ? () => navigate(`/training/session/${session.id}/summary`) : session.status === 'active' ? () => navigate(`/training/session/${session.id}`) : start}
          >
            {done ? t('trainingViewSummary') : session.status === 'active' ? t('trainingResume') : t('trainingStart')}
          </button>
        </div>

        <div className="tr-exercises">
          <div className="tr-exercises-head">
            <span className="tr-exercises-label">{t('trainingExercises')}</span>
            <span className="tr-exercises-note">{t('trainingWarmupIncluded')}</span>
          </div>
          <div className="tr-rows">
            {session.exercises.map((ex, i) => (
              <div key={ex.sessionExerciseId} className="tr-row">
                <span className="tr-row-n">{i + 1}</span>
                <div className="tr-row-body">
                  <div className="tr-row-name">{ex.name}</div>
                  {/* v6 keeps this to two items so it stays on one line. */}
                  <div className="tr-row-meta">
                    {ex.equipment}
                    {' · '}
                    {ex.previous
                      ? t('trainingLastSet', { weight: ex.previous.weight, reps: ex.previous.reps })
                      : t('trainingNoHistory')}
                  </div>
                </div>
                <button
                  type="button"
                  className="tr-row-swap"
                  onClick={() => navigate(`/training/exercises/${ex.exerciseId}`)}
                >
                  {t('trainingOpen')}
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className="today-link tr-library" onClick={() => navigate('/training/library')}>
          {t('trainingBrowseLibrary')}
        </button>
      </div>
    </Screen>
  );
}
