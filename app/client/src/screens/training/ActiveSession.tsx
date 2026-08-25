import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ExerciseListItem, WorkoutSession } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button } from '../../components/ui';
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

  return (
    <Screen nav={false}>
      <button className="auth-back" onClick={() => navigate('/training')} style={{ marginBottom: 16 }}>
        ← {t('trainingExit')}
      </button>
      <p className="sess-progress">
        {exIdx + 1} / {session.exercises.length}
      </p>
      <h1 className="sess-ex-name">{ex.name}</h1>
      <p className="sess-ex-meta">
        {ex.previous ? t('trainingLastTime', { weight: ex.previous.weight, reps: ex.previous.reps }) : t('trainingNoPrevious')}
      </p>

      {restLeft > 0 ? (
        <div className="sess-rest">
          <p className="sess-rest-n">{Math.floor(restLeft / 60)}:{(restLeft % 60).toString().padStart(2, '0')}</p>
          <p className="sess-progress" style={{ marginTop: 8 }}>
            {t('trainingRest')}
          </p>
          <div className="sess-rest-actions">
            <Button variant="secondary" onClick={() => setRestLeft((s) => s + 30)}>
              {t('trainingPlus30')}
            </Button>
            <Button variant="ghost" onClick={() => setRestLeft(0)}>
              {t('trainingSkip')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="sess-current">
          <div className="sess-fields">
            <div className="sess-field">
              <span className="sess-field-label">{t('trainingWeightKg')}</span>
              <div className="sess-stepper">
                <button className="sess-step-btn" onClick={() => setWeight((w) => Math.max(0, w - 2.5))}>
                  −
                </button>
                <span className="sess-value">{weight}</span>
                <button className="sess-step-btn" onClick={() => setWeight((w) => w + 2.5)}>
                  +
                </button>
              </div>
            </div>
            <div className="sess-field">
              <span className="sess-field-label">{t('trainingReps')}</span>
              <div className="sess-stepper">
                <button className="sess-step-btn" onClick={() => setReps((r) => Math.max(0, r - 1))}>
                  −
                </button>
                <span className="sess-value">{reps}</span>
                <button className="sess-step-btn" onClick={() => setReps((r) => r + 1)}>
                  +
                </button>
              </div>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--mut)' }}>
            <input type="checkbox" checked={warmup} onChange={(e) => setWarmup(e.target.checked)} />
            {t('trainingWarmup')}
          </label>
          <Button full onClick={completeSet}>
            {t('trainingCompleteSet')}
          </Button>
        </div>
      )}

      <div className="sess-sets">
        {ex.sets.map((s) => (
          <div key={s.id} className={`sess-set-row ${s.isWarmup ? 'sess-warmup' : ''}`}>
            <span>
              {t('trainingSetLabel', { n: s.setIndex + 1 })}
              {s.isWarmup ? t('trainingWarmupSuffix') : ''}
            </span>
            <span>{s.weight}kg × {s.reps}</span>
          </div>
        ))}
      </div>

      <div className="quit-chip-list" style={{ marginBottom: 16 }}>
        <button className="today-link" onClick={() => navigate(`/training/exercises/${ex.exerciseId}`)}>
          {t('trainingTechnique')}
        </button>
        <button className="today-link" onClick={openSwap}>
          {t('trainingSwap')}
        </button>
      </div>

      {swapping && (
        <div className="sess-current" style={{ marginBottom: 16 }}>
          <span className="sess-field-label">{t('trainingSwapFor', { name: ex.name })}</span>
          {swapError && <p className="onb-error">{swapError}</p>}
          <div className="tr-list">
            {swapOptions.length === 0 ? (
              <p className="today-empty">{t('trainingNoOtherExercises', { group: ex.group.toLowerCase() })}</p>
            ) : (
              swapOptions.map((o) => (
                <button
                  key={o.id}
                  className="tr-row"
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                  onClick={() => doSwap(o.id)}
                >
                  <p className="tr-name">{o.name}</p>
                </button>
              ))
            )}
          </div>
          <Button variant="ghost" onClick={() => setSwapping(false)}>
            {t('trainingCancel')}
          </Button>
        </div>
      )}

      <div className="sess-nav">
        <Button variant="secondary" disabled={exIdx === 0} onClick={() => setExIdx((i) => i - 1)}>
          {t('trainingPrevious')}
        </Button>
        {nextEx ? (
          <Button variant="secondary" onClick={() => setExIdx((i) => i + 1)}>
            {t('trainingNext', { name: nextEx.name })}
          </Button>
        ) : (
          <Button onClick={finish}>{t('trainingFinish')}</Button>
        )}
      </div>
    </Screen>
  );
}
