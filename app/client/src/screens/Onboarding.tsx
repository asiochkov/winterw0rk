import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import type { User } from '../api/types';
import { Button } from '../components/ui';
import { categoryLabel } from '../lib/habitCategories';
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
  { n: 'No Junk Food', c: 'NUTRITION', labelKey: 'habitNoJunkFood' },
  { n: 'Lights Out 22:30', c: 'SLEEP', labelKey: 'habitLightsOut' },
  { n: 'Walk', c: 'BODY', labelKey: 'habitWalk' },
  { n: 'Stretch', c: 'BODY', labelKey: 'habitStretch' },
  { n: 'No Phone First Hour', c: 'FOCUS', labelKey: 'habitNoPhoneFirstHour' },
  { n: 'Water', c: 'NUTRITION', labelKey: 'habitWater' },
  { n: 'Meditate', c: 'MIND', labelKey: 'habitMeditate' },
] as const;

/**
 * Step 2 asks what the user is here for and, until now, nothing in the flow
 * ever read the answer — the same seven habits were offered whichever goal was
 * chosen. The goal now decides what is suggested first; everything stays
 * reachable through "show all", so the choice narrows the screen without
 * hiding anything.
 */
const GOAL_SUGGESTS: Record<string, readonly string[]> = {
  discipline: ['Workout', 'Deep Work', 'Lights Out 22:30', 'Journal', 'No Phone First Hour'],
  body: ['Workout', 'Walk', 'No Junk Food', 'Water', 'Stretch', 'Cold Shower'],
  focus: ['Deep Work', 'No Phone First Hour', 'Reading', 'Meditate', 'Lights Out 22:30'],
  reset: ['Lights Out 22:30', 'Walk', 'Journal', 'Meditate', 'Water'],
};

/**
 * Every habit was created seven days a week regardless of what the user had in
 * mind, and there was no screen anywhere to correct it — so someone who meant
 * "three times a week" broke a streak four days out of seven from day one.
 * Index 0 is Monday, matching the day picker on the habit form.
 */
const FREQUENCIES = [
  { k: 'daily', labelKey: 'freqDaily', days: [0, 1, 2, 3, 4, 5, 6] },
  { k: 'weekdays', labelKey: 'freqWeekdays', days: [0, 1, 2, 3, 4] },
  { k: 'thrice', labelKey: 'freqThrice', days: [0, 2, 4] },
] as const;

type Frequency = (typeof FREQUENCIES)[number]['k'];

type Step = 'intro' | 'goal' | 'areas' | 'habits' | 'commit';

const STEPS: Step[] = ['intro', 'goal', 'areas', 'habits', 'commit'];

/** Onboarding is five screens deep and, until now, entirely in memory: a
 *  refresh, a mistyped URL or a phone locking the tab threw the whole thing
 *  away and started again at the intro. It is kept per account so a second
 *  person signing in on the same device does not inherit the first one's
 *  half-finished answers. */
const DRAFT_KEY = 'ww.onboarding.draft';

interface Draft {
  userId: number;
  step: Step;
  goal: string;
  areas: string[];
  habits: string[];
  frequency?: Record<string, Frequency>;
}

function readDraft(userId: number | undefined): Draft | null {
  if (userId == null) return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (draft.userId !== userId || !STEPS.includes(draft.step)) return null;
    return draft;
  } catch {
    // A private window, cleared storage or a draft written by an older build.
    return null;
  }
}

/**
 * The guard is its own component so the flow below only ever mounts with a
 * known account. Reading the saved draft in a state initialiser is otherwise
 * useless: on the first render the session is still loading, there is no user
 * id to match the draft against, and the initialiser never runs a second time.
 */
export default function Onboarding() {
  const { user, loading, setUser } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.onboarded) return <Navigate to="/today" replace />;
  return <OnboardingFlow user={user} setUser={setUser} />;
}

function OnboardingFlow({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const draft = readDraft(user.id);
  const [step, setStep] = useState<Step>(draft?.step ?? 'intro');
  const [goal, setGoal] = useState(draft?.goal ?? '');
  const [areas, setAreas] = useState<string[]>(draft?.areas ?? []);
  const [habits, setHabits] = useState<string[]>(draft?.habits ?? []);
  const [frequency, setFrequency] = useState<Record<string, Frequency>>(draft?.frequency ?? {});
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const userId = user.id;
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ userId, step, goal, areas, habits, frequency }));
    } catch {
      /* storage unavailable — the flow still works, it just won't survive a reload */
    }
  }, [userId, step, goal, areas, habits, frequency]);

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
          const freq = FREQUENCIES.find((f) => f.k === (frequency[n] ?? 'daily'))!;
          return { name: p.n, category: p.c, type: 'bool' as const, schedule: [...freq.days] };
        }),
      };
      const { user: updated } = await api.post<{ user: User }>('/auth/onboarding', payload);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* nothing to clean up if storage was never available */
      }
      setUser(updated);
      navigate('/today');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('onbSaveError'));
    } finally {
      setBusy(false);
    }
  }

  const suggested = PICKABLE.filter((p) => (GOAL_SUGGESTS[goal] ?? []).includes(p.n));
  // A picked habit stays on screen even if it is not suggested for this goal,
  // so going back and changing the goal never silently drops a choice.
  const visibleHabits =
    showAllHabits || suggested.length === 0
      ? PICKABLE
      : PICKABLE.filter((p) => suggested.includes(p) || habits.includes(p.n));

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="onb-shell">
      <div className="onb-head">
        {stepIndex > 0 ? (
          <button type="button" className="onb-back" onClick={() => setStep(STEPS[stepIndex - 1])}>
            <span aria-hidden="true">←</span> {t('back')}
          </button>
        ) : (
          <span className="onb-back-spacer" />
        )}
        <div className="onb-progress">
          {STEPS.map((s, i) => (
            <span key={s} className={`onb-dot ${i <= stepIndex ? 'onb-dot-on' : ''}`} />
          ))}
        </div>
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
            {visibleHabits.map((p) => {
              const picked = habits.includes(p.n);
              return (
                <div key={p.n} className={`onb-option onb-option-row ${picked ? 'onb-option-on' : ''}`}>
                  <button
                    type="button"
                    className="onb-option-main"
                    onClick={() => toggle(habits, setHabits, p.n)}
                    aria-pressed={picked}
                  >
                    <span className="onb-option-label">{t(p.labelKey)}</span>
                    <span className="onb-option-hint">{categoryLabel(p.c, t)}</span>
                  </button>
                  {/* The frequency only matters once the habit is actually
                      chosen, so it appears with the choice rather than adding
                      seven more controls to a list nobody has picked from. */}
                  {picked && (
                    <div className="onb-freq">
                      {FREQUENCIES.map((f) => (
                        <button
                          key={f.k}
                          type="button"
                          className={`onb-freq-btn ${(frequency[p.n] ?? 'daily') === f.k ? 'is-on' : ''}`}
                          aria-pressed={(frequency[p.n] ?? 'daily') === f.k}
                          onClick={() => setFrequency((m) => ({ ...m, [p.n]: f.k }))}
                        >
                          {t(f.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!showAllHabits && suggested.length < PICKABLE.length && (
            <button type="button" className="onb-more" onClick={() => setShowAllHabits(true)}>
              {t('onbShowAllHabits')}
            </button>
          )}
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
