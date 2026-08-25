import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { usePedometer } from '../hooks/usePedometer';
import { Screen } from '../components/Shell';
import { Banner, Button, Field, Input, ProgressBar, Section } from '../components/ui';
import './steps.css';

interface StepEntry {
  date: string;
  steps: number;
  goal: number;
  source: 'sensor' | 'manual';
}

/** How often the on-device count is pushed to the server while counting. */
const SYNC_INTERVAL_MS = 15000;

export default function Steps() {
  const { t } = useLanguage();
  const [today, setToday] = useState<StepEntry | null>(null);
  const [history, setHistory] = useState<StepEntry[]>([]);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [manualValue, setManualValue] = useState('');
  const [goalDraft, setGoalDraft] = useState('');

  // Steps already banked on the server when this counting session began.
  const baselineRef = useRef(0);
  const pedometer = usePedometer();

  const load = useCallback(async () => {
    const [t1, h] = await Promise.all([
      api.get<{ entry: StepEntry }>('/steps/today'),
      api.get<{ entries: StepEntry[]; dailyAverage: number }>('/steps/history'),
    ]);
    setToday(t1.entry);
    setHistory(h.entries);
    setDailyAverage(h.dailyAverage);
    return t1.entry;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syncSteps = useCallback(async (total: number) => {
    const { entry } = await api.post<{ entry: StepEntry }>('/steps/sync', { steps: total, source: 'sensor' });
    setToday(entry);
  }, []);

  // Push the running total periodically rather than on every footfall.
  useEffect(() => {
    if (pedometer.status !== 'counting') return;
    const timer = setInterval(() => {
      syncSteps(baselineRef.current + pedometer.sessionSteps);
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pedometer.status, pedometer.sessionSteps, syncSteps]);

  async function startCounting() {
    const entry = await load();
    baselineRef.current = entry.steps;
    pedometer.resetSession();
    pedometer.start();
  }

  async function stopCounting() {
    pedometer.stop();
    await syncSteps(baselineRef.current + pedometer.sessionSteps);
    load();
  }

  async function saveManual() {
    const value = Number(manualValue);
    if (!Number.isFinite(value) || value < 0) return;
    const { entry } = await api.post<{ entry: StepEntry }>('/steps/sync', { steps: value, source: 'manual' });
    setToday(entry);
    setManualValue('');
    load();
  }

  async function saveGoal() {
    const goal = Number(goalDraft);
    if (!Number.isFinite(goal) || goal < 500) return;
    const { entry } = await api.patch<{ entry: StepEntry }>('/steps/goal', { goal });
    setToday(entry);
    setGoalDraft('');
  }

  if (!today) return <Screen title={t('stepsTitle')} nav={false}>{null}</Screen>;

  const liveTotal = pedometer.status === 'counting' ? baselineRef.current + pedometer.sessionSteps : today.steps;
  const pct = today.goal ? (liveTotal / today.goal) * 100 : 0;
  const remaining = Math.max(0, today.goal - liveTotal);

  return (
    <Screen title={t('stepsTitle')} kicker={t('stepsKicker')} nav={false}>
      <Section>
        <p className="steps-count">{liveTotal.toLocaleString()}</p>
        <p className="steps-goal-line">{t('stepsOfGoal', { goal: today.goal.toLocaleString() })}</p>
        <ProgressBar value={pct} tone={pct >= 100 ? 'ok' : 'ac'} />
        <p className="tr-meta" style={{ marginTop: 8 }}>
          {remaining > 0 ? t('stepsRemaining', { n: remaining.toLocaleString() }) : t('stepsGoalReached')}
        </p>
      </Section>

      <Section title={t('stepsCounter')}>
        {pedometer.status === 'counting' ? (
          <>
            <Banner tone="ok">{t('stepsCounting', { n: pedometer.sessionSteps })}</Banner>
            <p className="tr-meta" style={{ margin: '8px 0 12px' }}>{t('stepsKeepOpen')}</p>
            <Button full variant="secondary" onClick={stopCounting}>
              {t('stepsStop')}
            </Button>
          </>
        ) : pedometer.status === 'denied' ? (
          <Banner tone="dg">{t('stepsDenied')}</Banner>
        ) : pedometer.status === 'unsupported' ? (
          <Banner tone="am">{t('stepsUnsupported')}</Banner>
        ) : (
          <>
            <Button full onClick={startCounting} disabled={pedometer.status === 'requesting'}>
              {pedometer.status === 'requesting' ? t('stepsRequesting') : t('stepsStart')}
            </Button>
            <p className="tr-meta" style={{ marginTop: 10 }}>{t('stepsSensorNote')}</p>
          </>
        )}
      </Section>

      <Section title={t('stepsManual')}>
        <div className="planner-add">
          <Input
            type="number"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={t('stepsManualPlaceholder')}
          />
          <Button variant="secondary" onClick={saveManual}>
            {t('save')}
          </Button>
        </div>
        <p className="tr-meta" style={{ marginTop: 8 }}>{t('stepsManualNote')}</p>
      </Section>

      <Section title={t('stepsGoalSetting')}>
        <div className="planner-add">
          <Field label={t('stepsDailyGoal')}>
            <Input
              type="number"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              placeholder={String(today.goal)}
            />
          </Field>
          <Button variant="secondary" onClick={saveGoal}>
            {t('save')}
          </Button>
        </div>
      </Section>

      <Section title={t('stepsHistory', { avg: dailyAverage.toLocaleString() })}>
        {history.length === 0 ? (
          <p className="today-empty">{t('stepsNoHistory')}</p>
        ) : (
          <div className="detail-history">
            {history.map((h) => (
              <div key={h.date} className="detail-history-row">
                <span className="detail-history-date">{h.date}</span>
                <span className="detail-history-value">
                  {h.steps.toLocaleString()} {h.steps >= h.goal ? '✓' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Screen>
  );
}
