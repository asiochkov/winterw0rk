import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { WorkoutSession } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { ErrorState, LoadingRows } from '../../components/states';
import '../training.css';

interface SummaryPr {
  exercise: string;
  weight: number;
  reps: number;
}

interface Summary {
  tonnage: number;
  setCount: number;
  durationSec: number;
  prs: SummaryPr[];
  /** Tonnage of the last completed session of the same name, if there was one. */
  previousTonnage: number | null;
  changePct: number | null;
  next: { weekday: number; name: string } | null;
}

/** v7's fmt(): mm:ss, both halves zero-padded. */
function clock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** The five faces v7 offers under "how did it feel". */
const FEELINGS = [1, 2, 3, 4, 5];

/** v7 names the next session by weekday; 0 is Monday, as everywhere here. */
const WEEKDAY_KEYS = [
  'weekdayMon',
  'weekdayTue',
  'weekdayWed',
  'weekdayThu',
  'weekdayFri',
  'weekdaySat',
  'weekdaySun',
] as const;

export default function SessionSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api.get<{ session: WorkoutSession; summary: Summary }>(
        `/training/sessions/${id}/summary`
      );
      setSession(r.session);
      setSummary(r.summary);
      setFeeling(r.session.feeling);
      setNote(r.session.notes || '');
    } catch (err: any) {
      setError(err.message || t('genericError'));
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/training/sessions/${id}/reflection`, { feeling, notes: note });
      navigate('/today');
    } catch (err: any) {
      setError(err.message || t('genericError'));
      setSaving(false);
    }
  }

  if (error && !session) {
    return (
      <Screen nav={false} bleed>
        <div className="sum">
          <ErrorState message={error} onRetry={load} retryLabel={t('tryAgain')} />
        </div>
      </Screen>
    );
  }

  if (!session || !summary) {
    return (
      <Screen nav={false} bleed>
        <div className="sum">
          <LoadingRows rows={4} />
        </div>
      </Screen>
    );
  }

  return (
    <Screen nav={false} bleed>
      <div className="sum">
        <div className="sum-head">
          <div className="sum-chip">
            <span className="sum-chip-dot" aria-hidden="true" />
            {t('summaryLogged')}
          </div>
          <h1 className="sum-title">{session.name}</h1>
        </div>

        <div className="sum-stats">
          <div className="sum-stat">
            <div className="sum-label">{t('summaryDuration')}</div>
            <div className="sum-stat-v">{clock(summary.durationSec)}</div>
          </div>
          <div className="sum-stat">
            <div className="sum-label">{t('summarySets')}</div>
            <div className="sum-stat-v">{summary.setCount}</div>
          </div>
          <div className="sum-stat">
            <div className="sum-label">{t('summaryTonnage')}</div>
            {/* v7 writes the unit into the figure. It hardcodes "kg" while its
                own weight formatter says "кг" in Russian; the dictionary settles it. */}
            <div className="sum-stat-v">{t('summaryTonnageValue', { n: Math.round(summary.tonnage) })}</div>
          </div>
        </div>

        {/* v7 reads the session against the last time the same one was run.
            With nothing to compare against there is no percentage to show, so
            the row states that instead of printing a hollow +0%. */}
        <div className="sum-change">
          <span className="sum-label">{t('summaryChange')}</span>
          {summary.changePct === null ? (
            <span className="sum-change-read">{t('summaryChangeNoPrior')}</span>
          ) : (
            <>
              <span className={`sum-change-v ${summary.changePct >= 0 ? 'is-up' : 'is-down'}`}>
                {summary.changePct >= 0 ? '+' : ''}
                {summary.changePct}%
              </span>
              <span className="sum-change-read">
                {t('summaryChangeRead', {
                  now: Math.round(summary.tonnage),
                  before: Math.round(summary.previousTonnage ?? 0),
                })}
              </span>
            </>
          )}
        </div>

        {/* v6 only draws this card when something was actually beaten. */}
        {summary.prs.length > 0 && (
          <div className="sum-prs">
            <div className="sum-label">{t('summaryRecords')}</div>
            <div className="sum-pr-list">
              {summary.prs.map((pr) => (
                <div className="sum-pr" key={pr.exercise}>
                  <span className="sum-pr-ex">{pr.exercise}</span>
                  <span className="sum-pr-val">
                    {pr.weight > 0
                      ? t('summaryPrValue', { weight: pr.weight, reps: pr.reps })
                      : t('summaryReps', { n: pr.reps })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sum-feel">
          <div className="sum-label">{t('summaryFeeling')}</div>
          <div className="sum-feel-row">
            {FEELINGS.map((n) => (
              <button
                key={n}
                type="button"
                className={`sum-feel-btn ${feeling === n ? 'is-on' : ''}`}
                aria-pressed={feeling === n}
                onClick={() => setFeeling((cur) => (cur === n ? null : n))}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="sum-note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('summaryNotePlaceholder')}
          />
        </div>

        <div className="sum-next">
          <span className="sum-label">{t('summaryNext')}</span>
          <span className="sum-next-v">
            {summary.next ? (
              <>
                {/* v7 keeps the weekday in caps and the session name as it is. */}
                <span className="sum-next-day">{t(WEEKDAY_KEYS[summary.next.weekday])}</span>
                {` · ${summary.next.name}`}
              </>
            ) : (
              t('summaryNextNone')
            )}
          </span>
        </div>

        {error && <p className="inline-error">{error}</p>}

        <button type="button" className="sum-save" onClick={save} disabled={saving}>
          {t('summarySave')}
        </button>
      </div>
    </Screen>
  );
}
