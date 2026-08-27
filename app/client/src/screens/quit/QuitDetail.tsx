import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { CravingEpisode, QuitCounter, RelapseEvent } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, Section } from '../../components/ui';
import { CleanStrip, QuitHero, RecoveryMilestones } from './QuitHero';
import '../quit.css';

const TRIGGER_KEYS = ['triggerStress', 'triggerBoredom', 'triggerSocial', 'triggerAlcohol', 'triggerAfterMeal'] as const;
const COPING_KEYS = ['copingBreathing', 'copingWater', 'copingWalk', 'copingPushups', 'copingCall'] as const;

function formatClean(startDate: string) {
  const start = new Date(startDate + 'T00:00:00').getTime();
  const secs = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { days, label: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` };
}

export default function QuitDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [counter, setCounter] = useState<QuitCounter | null>(null);
  const [cravings, setCravings] = useState<CravingEpisode[]>([]);
  const [relapses, setRelapses] = useState<RelapseEvent[]>([]);
  const [tick, setTick] = useState(0);
  const [flow, setFlow] = useState<'idle' | 'intensity' | 'trigger' | 'coping' | 'done'>('idle');
  const [intensity, setIntensity] = useState(0);
  const [trigger, setTrigger] = useState('');
  const [relapseConfirm, setRelapseConfirm] = useState(false);

  async function load() {
    const r = await api.get<{ counter: QuitCounter; cravings: CravingEpisode[]; relapses: RelapseEvent[] }>(`/quit/${id}`);
    setCounter(r.counter);
    setCravings(r.cravings);
    setRelapses(r.relapses);
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const clean = useMemo(() => (counter ? formatClean(counter.startDate) : null), [counter, tick]);

  async function finishCraving(actionKey: (typeof COPING_KEYS)[number]) {
    await api.post(`/quit/${id}/craving`, { intensity, trigger, copingAction: t(actionKey) });
    setFlow('done');
    setTimeout(() => setFlow('idle'), 2200);
    load();
  }

  async function logRelapse() {
    await api.post(`/quit/${id}/relapse`, {});
    setRelapseConfirm(false);
    load();
  }

  if (!counter || !clean) return <Screen nav={false}>{null}</Screen>;

  const saved = Math.round(counter.moneySaved);
  const notConsumed = Math.floor(clean.days * counter.dailyAmount);
  const goalPct = counter.goalAmount ? Math.min(100, Math.round((saved / counter.goalAmount) * 100)) : 0;

  return (
    <Screen nav={false} bleed>
      <QuitHero
        kicker={counter.kind}
        days={clean.days}
        clock={clean.label}
        since={t('quitSince', { date: counter.startDate })}
      />

      <div className="q-body">
        <button type="button" className="q-craving" onClick={() => setFlow('intensity')}>
          {t('quitCravingBtn')}
        </button>

        <div className="q-pair">
          <div className="q-card">
            <div className="q-stat-label">{t('quitSavedLabel')}</div>
            <div className="q-stat-value">{counter.unitCost > 0 ? `€${saved}` : '—'}</div>
            <div className={`q-stat-sub ${counter.goalLabel ? 'is-accent' : ''}`}>
              {counter.goalLabel ? t('quitGoalToward', { goal: counter.goalLabel }) : t('quitNoGoal')}
            </div>
            {counter.goalAmount ? (
              <div className="q-goal-track">
                <div className="q-goal-fill" style={{ width: `${goalPct}%` }} />
              </div>
            ) : null}
          </div>
          <div className="q-card">
            <div className="q-stat-label">{t('quitNotConsumed')}</div>
            <div className="q-stat-value">{notConsumed}</div>
            <div className="q-stat-sub">{counter.kind}</div>
          </div>
        </div>

        <CleanStrip startDate={counter.startDate} relapses={relapses} />

        <RecoveryMilestones kind={counter.kind} daysClean={clean.days} />

        <div className="q-card">
          <div className="q-card-label" style={{ marginBottom: 18 }}>
            {t('quitAttempts')}
          </div>
          <div className="q-runs">
            <div>
              <div className="q-run-n">{clean.days}</div>
              <div className="q-run-l">{t('quitCurrentRunShort')}</div>
            </div>
            <div>
              <div className="q-run-n">{counter.bestRunDays}</div>
              <div className="q-run-l">{t('quitBestRun')}</div>
            </div>
            <div>
              <div className="q-run-n">{counter.totalCleanDays}</div>
              <div className="q-run-l">{t('quitTotalClean')}</div>
            </div>
            <div>
              <div className="q-run-n">{counter.attempts}</div>
              <div className="q-run-l">{t('quitAttempts')}</div>
            </div>
          </div>
        </div>

      {flow === 'intensity' && (
        <Section title={t('quitIntensityQ')}>
          <div className="quit-craving-grid">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`quit-int-btn ${intensity === n ? 'quit-int-btn-on' : ''}`}
                onClick={() => {
                  setIntensity(n);
                  setFlow('trigger');
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </Section>
      )}

      {flow === 'trigger' && (
        <Section title={t('quitTriggerQ')}>
          <div className="quit-chip-list">
            {TRIGGER_KEYS.map((key) => (
              <button
                key={key}
                className="quit-chip"
                onClick={() => {
                  setTrigger(t(key));
                  setFlow('coping');
                }}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </Section>
      )}

      {flow === 'coping' && (
        <Section title={t('quitCopingQ')}>
          <div className="form-stack">
            {COPING_KEYS.map((key) => (
              <Button key={key} full variant="secondary" onClick={() => finishCraving(key)}>
                {t(key)}
              </Button>
            ))}
          </div>
        </Section>
      )}

      {flow === 'done' && (
        <Section>
          <p className="today-mood-set">{t('quitPassed')}</p>
        </Section>
      )}

      <Section title={t('quitRecentCravings')}>
        {cravings.length === 0 ? (
          <p className="today-empty">{t('none')}</p>
        ) : (
          cravings.slice(0, 5).map((c) => (
            <div key={c.id} className="quit-history-row">
              <span>{t('quitIntensityQ').replace('?', '')} {c.intensity} · {c.trigger || '—'}</span>
              <span style={{ color: 'var(--mut)' }}>{c.timestamp.slice(5, 16)}</span>
            </div>
          ))
        )}
      </Section>

      <Section title={t('quitHistory')}>
        {relapses.length === 0 ? (
          <p className="today-empty">{t('quitNoRelapses')}</p>
        ) : (
          relapses.slice(0, 5).map((r) => (
            <div key={r.id} className="quit-history-row">
              <span>{r.run_days}d {r.trigger ? `· ${r.trigger}` : ''}</span>
              <span style={{ color: 'var(--mut)' }}>{r.timestamp.slice(5, 16)}</span>
            </div>
          ))
        )}
      </Section>

      <Section>
        {!relapseConfirm ? (
          <button className="today-link" onClick={() => setRelapseConfirm(true)}>
            {t('quitLogRelapse')}
          </button>
        ) : (
          <div className="form-stack">
            <p className="today-empty">{t('quitRelapseConfirm')}</p>
            <Button full variant="secondary" onClick={logRelapse}>
              {t('quitRelapseConfirmBtn')}
            </Button>
            <Button full variant="ghost" onClick={() => setRelapseConfirm(false)}>
              {t('quitNeverMind')}
            </Button>
          </div>
        )}
      </Section>
      </div>
    </Screen>
  );
}
