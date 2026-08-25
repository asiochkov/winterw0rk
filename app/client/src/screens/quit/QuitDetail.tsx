import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { CravingEpisode, QuitCounter, RelapseEvent } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, Section } from '../../components/ui';
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
  const navigate = useNavigate();
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

  return (
    <Screen kicker={t('quitTitle')} title={counter.kind} nav={false}>
      <button className="auth-back" onClick={() => navigate('/quit')} style={{ marginBottom: 16 }}>
        ← {t('quitTitle')}
      </button>

      <div className="quit-live">
        <p className="quit-live-n">
          {clean.days}
          <span style={{ fontSize: 20 }}>d</span> {clean.label}
        </p>
        <p className="quit-live-l">{t('quitCurrentRun', { date: counter.startDate })}</p>
      </div>

      <div className="quit-metrics">
        <div className="detail-stat">
          <span className="detail-stat-n">{counter.bestRunDays}</span>
          <span className="detail-stat-l">{t('quitBestRun')}</span>
        </div>
        <div className="detail-stat">
          <span className="detail-stat-n">{counter.totalCleanDays}</span>
          <span className="detail-stat-l">{t('quitTotalClean')}</span>
        </div>
        <div className="detail-stat">
          <span className="detail-stat-n">{counter.attempts}</span>
          <span className="detail-stat-l">{t('quitAttempts')}</span>
        </div>
      </div>

      {flow === 'idle' && (
        <Section>
          <Button full onClick={() => setFlow('intensity')}>
            {t('quitCravingBtn')}
          </Button>
        </Section>
      )}

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
    </Screen>
  );
}
