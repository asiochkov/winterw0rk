import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { FocusMode } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Button, Section } from '../components/ui';
import './focus.css';

const MODES: { k: FocusMode; labelKey: 'focusPomodoro' | 'focusDeep' | 'focusCustom'; sec: number }[] = [
  { k: 'pomodoro', labelKey: 'focusPomodoro', sec: 25 * 60 },
  { k: 'deep', labelKey: 'focusDeep', sec: 50 * 60 },
  { k: 'custom', labelKey: 'focusCustom', sec: 90 * 60 },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Focus() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [customMin, setCustomMin] = useState(90);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [plannedSec, setPlannedSec] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          finish(plannedSec);
          return 0;
        }
        elapsedRef.current += 1;
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function start() {
    const sec = mode === 'custom' ? customMin * 60 : MODES.find((m) => m.k === mode)!.sec;
    const { id } = await api.post<{ id: number }>('/focus/start', { mode, plannedSec: sec });
    setSessionId(id);
    setPlannedSec(sec);
    setRemaining(sec);
    elapsedRef.current = 0;
    setRunning(true);
    setDone(false);
  }

  async function finish(planned: number) {
    if (!sessionId) return;
    setRunning(false);
    await api.post(`/focus/${sessionId}/finish`, { actualSec: elapsedRef.current || planned });
    setDone(true);
    setSessionId(null);
  }

  function stopEarly() {
    finish(plannedSec);
  }

  if (sessionId && !done) {
    return (
      <Screen nav={false}>
        <div className="focus-active">
          <p className="sess-progress">{t(MODES.find((m) => m.k === mode)!.labelKey).toUpperCase()}</p>
          <p className="focus-clock">{fmt(remaining)}</p>
          <div className="sess-rest-actions" style={{ marginTop: 24 }}>
            <Button variant="secondary" onClick={() => setRunning((r) => !r)}>
              {running ? t('focusPause') : t('focusResume')}
            </Button>
            <Button variant="ghost" onClick={stopEarly}>
              {t('focusStop')}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title={t('focusTitle')} kicker={t('focusKicker')} nav>
      {done && (
        <Section>
          <p className="mood-today-set" style={{ display: 'block' }}>
            {t('focusRecorded')}
          </p>
        </Section>
      )}
      <Section title={t('focusMethod')}>
        <div className="type-row">
          {MODES.map((m) => (
            <button key={m.k} className={`type-btn ${mode === m.k ? 'type-btn-on' : ''}`} onClick={() => setMode(m.k)}>
              {t(m.labelKey)}
            </button>
          ))}
        </div>
      </Section>
      {mode === 'custom' && (
        <Section title={t('focusMinutes')}>
          <div className="sess-stepper" style={{ justifyContent: 'center' }}>
            <button className="sess-step-btn" onClick={() => setCustomMin((m) => Math.max(5, m - 5))}>
              −
            </button>
            <span className="sess-value">{customMin}</span>
            <button className="sess-step-btn" onClick={() => setCustomMin((m) => m + 5)}>
              +
            </button>
          </div>
        </Section>
      )}
      <Button full onClick={start}>
        {t('focusStart')}
      </Button>
      <button className="today-link" style={{ display: 'block', margin: '16px auto 0' }} onClick={() => navigate('/focus/history')}>
        {t('focusViewHistory')}
      </button>
    </Screen>
  );
}
