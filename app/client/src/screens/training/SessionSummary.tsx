import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { WorkoutSession } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, Section } from '../../components/ui';
import '../training.css';

export default function SessionSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    api.get<{ session: WorkoutSession }>(`/training/sessions/${id}`).then((r) => setSession(r.session));
  }, [id]);

  if (!session) return <Screen nav>{null}</Screen>;

  const workingSets = session.exercises.flatMap((e) => e.sets.filter((s) => !s.isWarmup));
  const tonnage = workingSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
  const durationMin = session.durationSec ? Math.round(session.durationSec / 60) : 0;

  return (
    <Screen title={t('summaryTitle')} nav>
      <div className="sum-hero">
        <p className="sum-hero-n">{session.name}</p>
        <div className="sum-metrics">
          <div className="detail-stat">
            <span className="detail-stat-n">{durationMin}m</span>
            <span className="detail-stat-l">{t('summaryDuration')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{workingSets.length}</span>
            <span className="detail-stat-l">{t('summarySets')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{Math.round(tonnage)}</span>
            <span className="detail-stat-l">{t('summaryTonnage')}</span>
          </div>
        </div>
      </div>

      <Section title={t('summaryWhatChanged')}>
        {session.exercises.some((e) => e.previous) ? (
          session.exercises
            .filter((e) => e.sets.some((s) => !s.isWarmup))
            .map((e) => {
              const best = e.sets.filter((s) => !s.isWarmup).sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
              const isPR = best && e.previous && best.weight! > e.previous.weight;
              return (
                <div key={e.sessionExerciseId} className="pr-row">
                  <span>{e.name}</span>
                  <span style={{ color: isPR ? 'var(--am)' : 'var(--mut)', fontWeight: isPR ? 700 : 400 }}>
                    {best ? `${best.weight}kg × ${best.reps}` : '—'} {isPR ? `· ${t('summaryPR')}` : ''}
                  </span>
                </div>
              );
            })
        ) : (
          <p className="today-empty">{t('summaryNoPrior')}</p>
        )}
      </Section>

      <Button full onClick={() => navigate('/today')}>
        {t('summaryBackToToday')}
      </Button>
    </Screen>
  );
}
