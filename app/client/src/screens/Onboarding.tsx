import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import type { User } from '../api/types';
import { Button } from '../components/ui';
import './onboarding.css';

const GOALS = [
  { k: 'discipline', labelKey: 'goalDiscipline', hintKey: 'goalDisciplineHint' },
  { k: 'body', labelKey: 'goalBody', hintKey: 'goalBodyHint' },
  { k: 'focus', labelKey: 'goalFocus', hintKey: 'goalFocusHint' },
  { k: 'reset', labelKey: 'goalReset', hintKey: 'goalResetHint' },
] as const;

const AREAS = [
  { k: 'Training', labelKey: 'areaTraining' },
  { k: 'Focus', labelKey: 'areaFocus' },
  { k: 'Sleep', labelKey: 'areaSleep' },
  { k: 'Nutrition', labelKey: 'areaNutrition' },
  { k: 'Reading', labelKey: 'areaReading' },
  { k: 'Cold', labelKey: 'areaCold' },
  { k: 'Mobility', labelKey: 'areaMobility' },
] as const;

const PICKABLE = [
  { n: 'Workout', c: 'TRAINING', labelKey: 'habitWorkout' },
  { n: 'Reading', c: 'MIND', labelKey: 'habitReading' },
  { n: 'Cold Shower', c: 'BODY', labelKey: 'habitColdShower' },
  { n: 'Deep Work', c: 'FOCUS', labelKey: 'habitDeepWork' },
  { n: 'Journal', c: 'MIND', labelKey: 'habitJournal' },
  { n: 'No Junk Food', c: 'BODY', labelKey: 'habitNoJunkFood' },
  { n: 'Lights Out 22:30', c: 'SLEEP', labelKey: 'habitLightsOut' },
] as const;

type Step = 'intro' | 'goal' | 'areas' | 'habits' | 'commit';

export default function Onboarding() {
  const { user, loading, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [goal, setGoal] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [habits, setHabits] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.onboarded) return <Navigate to="/today" replace />;

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function commit() {
    setBusy(true);
    setError('');
    try {
      const payload = {
        goal,
        areas,
        habits: habits.map((n) => {
          const p = PICKABLE.find((x) => x.n === n)!;
          return { name: p.n, category: p.c, type: 'bool' as const, schedule: [0, 1, 2, 3, 4, 5, 6] };
        }),
      };
      const { user: updated } = await api.post<{ user: User }>('/auth/onboarding', payload);
      setUser(updated);
      navigate('/today');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('onbSaveError'));
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = ['intro', 'goal', 'areas', 'habits', 'commit'].indexOf(step);

  return (
    <div className="onb-shell">
      <div className="onb-progress">
        {['intro', 'goal', 'areas', 'habits', 'commit'].map((s, i) => (
          <span key={s} className={`onb-dot ${i <= stepIndex ? 'onb-dot-on' : ''}`} />
        ))}
      </div>

      {step === 'intro' && (
        <div className="onb-step">
          <p className="onb-kicker">{t('onbIntroKicker')}</p>
          <h1 className="onb-title">{t('onbIntroTitle')}</h1>
          <p className="onb-body">{t('onbIntroBody')}</p>
          <Button full onClick={() => setStep('goal')}>
            {t('continueBtn')}
          </Button>
        </div>
      )}

      {step === 'goal' && (
        <div className="onb-step">
          <p className="onb-kicker">{t('onbGoalKicker')}</p>
          <h1 className="onb-title">{t('onbGoalTitle')}</h1>
          <p className="onb-body">{t('onbGoalBody')}</p>
          <div className="onb-list">
            {GOALS.map((g) => (
              <button key={g.k} className={`onb-option ${goal === g.k ? 'onb-option-on' : ''}`} onClick={() => setGoal(g.k)}>
                <span className="onb-option-label">{t(g.labelKey)}</span>
                <span className="onb-option-hint">{t(g.hintKey)}</span>
              </button>
            ))}
          </div>
          <Button full disabled={!goal} onClick={() => setStep('areas')}>
            {t('continueBtn')}
          </Button>
        </div>
      )}

      {step === 'areas' && (
        <div className="onb-step">
          <p className="onb-kicker">{t('onbAreasKicker')}</p>
          <h1 className="onb-title">{t('onbAreasTitle')}</h1>
          <p className="onb-body">{t('onbAreasBody')}</p>
          <div className="onb-chips">
            {AREAS.map((a) => (
              <button key={a.k} className={`onb-chip ${areas.includes(a.k) ? 'onb-chip-on' : ''}`} onClick={() => toggle(areas, setAreas, a.k)}>
                {t(a.labelKey)}
              </button>
            ))}
          </div>
          <Button full disabled={areas.length === 0} onClick={() => setStep('habits')}>
            {t('continueBtn')}
          </Button>
        </div>
      )}

      {step === 'habits' && (
        <div className="onb-step">
          <p className="onb-kicker">{t('onbHabitsKicker')}</p>
          <h1 className="onb-title">{t('onbHabitsTitle')}</h1>
          <p className="onb-body">{t('onbHabitsBody')}</p>
          <div className="onb-list">
            {PICKABLE.map((p) => (
              <button
                key={p.n}
                className={`onb-option onb-option-row ${habits.includes(p.n) ? 'onb-option-on' : ''}`}
                onClick={() => toggle(habits, setHabits, p.n)}
              >
                <span className="onb-option-label">{t(p.labelKey)}</span>
                <span className="onb-option-hint">{p.c}</span>
              </button>
            ))}
          </div>
          <Button full disabled={habits.length === 0} onClick={() => setStep('commit')}>
            {t('continueBtn')}
          </Button>
        </div>
      )}

      {step === 'commit' && (
        <div className="onb-step">
          <p className="onb-kicker">{t('onbCommitKicker')}</p>
          <h1 className="onb-title">{t('onbCommitTitle')}</h1>
          <p className="onb-body">{t('onbCommitBody')}</p>
          <div className="onb-summary">
            <div>
              <span className="onb-summary-label">{t('onbSummaryGoal')}</span>
              <span className="onb-summary-value">{t(GOALS.find((g) => g.k === goal)!.labelKey)}</span>
            </div>
            <div>
              <span className="onb-summary-label">{t('onbSummaryHabits')}</span>
              <span className="onb-summary-value">{habits.map((n) => t(PICKABLE.find((p) => p.n === n)!.labelKey)).join(', ')}</span>
            </div>
          </div>
          {error && <p className="onb-error">{error}</p>}
          <Button full disabled={busy} onClick={commit}>
            {busy ? t('onbStarting') : t('onbBegin')}
          </Button>
        </div>
      )}
    </div>
  );
}
