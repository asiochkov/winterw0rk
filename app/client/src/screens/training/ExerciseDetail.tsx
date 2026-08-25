import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ExerciseDetailData } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Section } from '../../components/ui';
import '../training.css';

interface HistoryRow {
  date: string;
  weight: number;
  reps: number;
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [exercise, setExercise] = useState<ExerciseDetailData | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [alternatives, setAlternatives] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api
      .get<{ exercise: ExerciseDetailData; history: HistoryRow[]; alternatives: { id: string; name: string }[] }>(`/exercises/${id}`)
      .then((r) => {
        setExercise(r.exercise);
        setHistory(r.history);
        setAlternatives(r.alternatives);
      });
  }, [id]);

  if (!exercise) return <Screen nav={false}>{null}</Screen>;

  const best = history.reduce((m, h) => (h.weight > m ? h.weight : m), 0);

  return (
    <Screen kicker={`${exercise.group} · ${exercise.equipment}`} title={exercise.name} nav={false}>
      <button className="auth-back" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← {t('back')}
      </button>

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
