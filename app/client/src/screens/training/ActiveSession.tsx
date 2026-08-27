import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ExerciseListItem, WorkoutSession } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import '../training.css';

const REST_SECONDS = 90;

export default function ActiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exIdx, setExIdx] = useState(0);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [warmup, setWarmup] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [showAllSets, setShowAllSets] = useState(false);
  /** Ticks once a second so the elapsed clock in the header stays live. The
   *  value is never read — the re-render is the point. */
  const [, setNowTick] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [swapOptions, setSwapOptions] = useState<ExerciseListItem[]>([]);
  const [swapError, setSwapError] = useState('');

  async function load() {
    const r = await api.get<{ session: WorkoutSession }>(`/training/sessions/${id}`);
    setSession(r.session);
    if (r.session.status === 'completed') {
      navigate(`/training/session/${id}/summary`, { replace: true });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (restLeft <= 0) return;
    const timer = setInterval(() => setRestLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [restLeft]);

  useEffect(() => {
    if (!session) return;
    const ex = session.exercises[exIdx];
    if (!ex) return;
    const lastSet = ex.sets[ex.sets.length - 1];
    if (lastSet) {
      setWeight(lastSet.weight || 0);
      setReps(lastSet.reps || 0);
    } else if (ex.previous) {
      setWeight(ex.previous.weight);
      setReps(ex.previous.reps);
    } else {
      setWeight(0);
      setReps(0);
    }
    setWarmup(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIdx, session?.id]);

  if (!session) return <Screen nav={false}>{null}</Screen>;
  const ex = session.exercises[exIdx];
  if (!ex) return null;

  async function completeSet() {
    await api.post(`/training/sessions/${session!.id}/sets`, {
      sessionExerciseId: ex.sessionExerciseId,
      weight,
      reps,
      isWarmup: warmup,
    });
    await load();
    if (!warmup) setRestLeft(REST_SECONDS);
  }

  async function finish() {
    await api.post(`/training/sessions/${session!.id}/finish`, {});
    navigate(`/training/session/${session!.id}/summary`);
  }

  const nextEx = session.exercises[exIdx + 1];

  async function openSwap() {
    setSwapError('');
    const r = await api.get<{ exercises: ExerciseListItem[] }>(`/exercises?group=${encodeURIComponent(ex.group)}`);
    setSwapOptions(r.exercises.filter((e) => e.id !== ex.exerciseId));
    setSwapping(true);
  }

  async function doSwap(exerciseId: string) {
    try {
      await api.patch(`/training/session-exercises/${ex.sessionExerciseId}/swap`, { exerciseId });
      setSwapping(false);
      await load();
    } catch (err: any) {
      setSwapError(err.message || t('genericError'));
    }
  }

  const elapsedSec = session.startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))
    : 0;
  const clock = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  const workingSets = ex.sets.filter((st) => !st.isWarmup).length;
  const donePct = Math.round(((exIdx + (workingSets ? 1 : 0)) / session.exercises.length) * 100);

  return (
    <Screen nav={false} bleed>
      <div className="ss-head">
        <div className="ss-head-row">
          <button type="button" className="ss-exit" onClick={() => navigate('/training')} aria-label={t('trainingExit')}>
            ←
          </button>
          <div className="ss-progress">
            <div className="ss-progress-top">
              <span>{clock(elapsedSec)}</span>
              <span>
                {exIdx + 1} / {session.exercises.length}
              </span>
            </div>
            <div className="ss-progress-track">
              <div className="ss-progress-fill" style={{ width: `${donePct}%` }} />
            </div>
          </div>
          {/* v6 keeps this short so the progress bar keeps its width. */}
          <button type="button" className="ss-finish" onClick={finish}>
            {t('trainingFinishShort')}
          </button>
        </div>
      </div>

      {restLeft > 0 && (
        <div className="ss-rest">
          <div>
            <div className="ss-rest-label">{t('trainingRest')}</div>
            <div className="ss-rest-time">{clock(restLeft)}</div>
          </div>
          <div className="ss-rest-actions">
            <button type="button" className="ss-rest-btn" onClick={() => setRestLeft((x) => x + 30)}>
              {t('trainingPlus30')}
            </button>
            <button type="button" className="ss-rest-btn" onClick={() => setRestLeft(0)}>
              {t('trainingSkip')}
            </button>
          </div>
        </div>
      )}

      <div className="ss-body">
        <div className="ss-card">
          <div className="ss-card-top">
            <span className="ss-kicker">
              {t('trainingExerciseOf', { n: exIdx + 1, total: session.exercises.length })}
            </span>
            <span className="ss-group">{ex.group}</span>
          </div>
          <div className="ss-ex-name">{ex.name}</div>
          <div className="ss-ex-last">
            {ex.previous
              ? t('trainingLastTime', { weight: ex.previous.weight, reps: ex.previous.reps })
              : t('trainingNoPrevious')}
          </div>

          <div className="ss-focus">
            <div className="ss-focus-kicker">
              {warmup ? t('trainingWarmup') : t('trainingSetLabel', { n: ex.sets.length + 1 })}
            </div>
            <div className="ss-focus-nums">
              <div>
                <div className="ss-focus-v">{reps}</div>
                <div className="ss-focus-l">{t('trainingReps')}</div>
              </div>
              <div>
                <div className="ss-focus-v">{weight}</div>
                <div className="ss-focus-l">{t('trainingWeightKg')}</div>
              </div>
            </div>

            <div className="ss-steppers">
              <div className="ss-stepper">
                <button type="button" onClick={() => setReps((r) => Math.max(0, r - 1))} aria-label="-1">−</button>
                <span>{t('trainingReps')}</span>
                <button type="button" onClick={() => setReps((r) => r + 1)} aria-label="+1">+</button>
              </div>
              <div className="ss-stepper">
                <button type="button" onClick={() => setWeight((w) => Math.max(0, w - 2.5))} aria-label="-2.5">−</button>
                <span>{t('trainingWeightKg')}</span>
                <button type="button" onClick={() => setWeight((w) => w + 2.5)} aria-label="+2.5">+</button>
              </div>
            </div>

            <button type="button" className="ss-log" onClick={completeSet}>
              {t('trainingCompleteSet')}
            </button>

            <label className="ss-warm">
              <input type="checkbox" checked={warmup} onChange={(e) => setWarmup(e.target.checked)} />
              {t('trainingWarmup')}
            </label>
          </div>

          <button type="button" className="ss-toggle" onClick={() => setShowAllSets((v) => !v)}>
            {showAllSets ? t('trainingHideSets') : t('trainingShowSets', { n: ex.sets.length })}
          </button>

          {showAllSets && (
            <div className="ss-sets">
              {ex.sets.length === 0 && <p className="today-empty">{t('trainingNoSetsYet')}</p>}
              {ex.sets.map((st) => (
                <div key={st.id} className={`ss-set ${st.isWarmup ? 'is-warm' : ''}`}>
                  <span className="ss-set-tag">{st.isWarmup ? 'W' : st.setIndex + 1}</span>
                  <span className="ss-set-label">
                    {st.weight}kg × {st.reps}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ss-links">
          <button type="button" className="today-link" onClick={() => navigate(`/training/exercises/${ex.exerciseId}`)}>
            {t('trainingTechnique')}
          </button>
          <button type="button" className="today-link" onClick={openSwap}>
            {t('trainingSwap')}
          </button>
        </div>

        {swapping && (
          <div className="ss-card">
            <div className="ss-kicker">{t('trainingSwapFor', { name: ex.name })}</div>
            {swapError && <p className="inline-error">{swapError}</p>}
            <div className="tr-rows" style={{ marginTop: 14 }}>
              {swapOptions.length === 0 ? (
                <p className="today-empty">{t('trainingNoOtherExercises', { group: ex.group.toLowerCase() })}</p>
              ) : (
                swapOptions.map((o) => (
                  <button key={o.id} type="button" className="tr-row" onClick={() => doSwap(o.id)}>
                    <span className="tr-row-body">
                      <span className="tr-row-name">{o.name}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <button type="button" className="ss-toggle" onClick={() => setSwapping(false)}>
              {t('trainingCancel')}
            </button>
          </div>
        )}

        <div className="ss-nav">
          <button type="button" className="ss-nav-btn" disabled={exIdx === 0} onClick={() => setExIdx((i) => i - 1)}>
            {t('trainingPrevious')}
          </button>
          {nextEx ? (
            <button type="button" className="ss-nav-btn" onClick={() => setExIdx((i) => i + 1)}>
              {t('trainingNext', { name: nextEx.name })}
            </button>
          ) : (
            <button type="button" className="ss-nav-btn is-primary" onClick={finish}>
              {t('trainingFinish')}
            </button>
          )}
        </div>
      </div>
    </Screen>
  );
}
