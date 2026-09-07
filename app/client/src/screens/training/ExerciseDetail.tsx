import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBack } from '../../hooks/useBack';
import { api } from '../../api/client';
import type { ExerciseDetailData } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Section } from '../../components/ui';
import { ErrorState, LoadingRows } from '../../components/states';
import { useAsyncData, useMutation } from '../../hooks/useAsyncData';
import { V6Icon } from '../../components/V6Icon';
import '../training.css';

interface HistoryRow {
  date: string;
  weight: number;
  reps: number;
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const back = useBack('/training/library');
  const { t } = useLanguage();
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  // This was a bare .then() with no rejection handler, so a failed load left
  // the screen blank for good.
  const state = useAsyncData(
    () =>
      api.get<{
        exercise: ExerciseDetailData;
        history: HistoryRow[];
        alternatives: { id: string; name: string }[];
      }>(`/exercises/${id}`),
    [id]
  );
  const mutation = useMutation();

  async function logSet() {
    const r = Number(reps);
    if (!Number.isFinite(r) || r <= 0) return;
    const w = weight === '' ? null : Number(weight);
    const ok = await mutation.run(
      () => api.post(`/training/exercises/${id}/sets`, { reps: r, weight: w }),
      { success: t('exerciseSetLogged') }
    );
    if (!ok) return;
    setReps('');
    setWeight('');
    state.reload();
  }

  if (state.loading) {
    return (
      <Screen nav={false} back={back}>
        <LoadingRows rows={4} />
      </Screen>
    );
  }
  if (state.error || !state.data) {
    return (
      <Screen nav={false} back={back}>
        <ErrorState message={state.error ?? t('genericError')} onRetry={state.reload} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }

  const { exercise, history, alternatives } = state.data;
  const best = history.reduce((m, h) => (h.weight > m ? h.weight : m), 0);
  const canLog = Number(reps) > 0;

  return (
    <Screen kicker={`${exercise.group} · ${exercise.equipment}`} title={exercise.name} nav={false} back={back}>

      {/* v7 puts a set logger on this screen so a set can be recorded without
          starting a session first. It writes into today's session. */}
      <div className="ex-log">
        <div className="ex-log-head">
          <span className="ex-log-label">{t('exerciseLogSet')}</span>
          <span className="ex-log-hint">
            {best ? t('exerciseLastBest', { kg: best }) : t('exerciseNoSets')}
          </span>
        </div>
        <div className="ex-log-row">
          <input
            type="number"
            inputMode="numeric"
            className="ex-log-input"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder={t('trainingReps')}
            aria-label={t('trainingReps')}
          />
          <input
            type="number"
            inputMode="decimal"
            className="ex-log-input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={t('trainingWeightKg')}
            aria-label={t('trainingWeightKg')}
          />
          <button
            type="button"
            className="ex-log-add"
            onClick={logSet}
            disabled={!canLog || mutation.busy}
            aria-label={t('exerciseLogSet')}
          >
            <V6Icon name="plus" size={20} stroke="currentColor" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <Section title={t('trainingTechnique')}>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--tx)', margin: 0 }}>{exercise.cue}</p>
      </Section>

      <Section title={t('exerciseErrors')}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--mut)', lineHeight: 1.8 }}>
          {exercise.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </Section>

      <Section title={best ? t('exerciseHistoryBest', { kg: best }) : t('exerciseHistory')}>
        {history.length === 0 ? (
          <p className="today-empty">{t('exerciseNoSets')}</p>
        ) : (
          <div className="detail-history">
            {history.map((h, i) => (
              <div key={i} className="detail-history-row">
                <span className="detail-history-date">{h.date}</span>
                <span className="detail-history-value">{h.weight}kg × {h.reps}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {alternatives.length > 0 && (
        <Section title={t('exerciseAlternatives')}>
          <div className="tr-list">
            {alternatives.map((a) => (
              <button
                key={a.id}
                className="tr-row"
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                onClick={() => navigate(`/training/exercises/${a.id}`)}
              >
                <p className="tr-name">{a.name}</p>
              </button>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}
