import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { MoodEntry } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Field, Input, Section } from '../components/ui';
import './mood.css';

const MOODS = [
  { k: 1, emoji: '😞', labelKey: 'moodTerrible' },
  { k: 2, emoji: '🙁', labelKey: 'moodBad' },
  { k: 3, emoji: '😐', labelKey: 'moodNeutral' },
  { k: 4, emoji: '🙂', labelKey: 'moodGood' },
  { k: 5, emoji: '😄', labelKey: 'moodExcellent' },
] as const;

const TAG_KEYS = ['moodTagCalm', 'moodTagTired', 'moodTagStressed', 'moodTagMotivated', 'moodTagAnxious', 'moodTagFocused', 'moodTagSore', 'moodTagSick'] as const;

function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const startWeekday = (first.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Mood() {
  const { t } = useLanguage();
  const DOW = [t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')];
  const [today, setToday] = useState<MoodEntry | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [pending, setPending] = useState<number | null>(null);
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');

  async function load() {
    const [t1, h] = await Promise.all([
      api.get<{ entry: MoodEntry | null }>('/mood/today'),
      api.get<{ entries: MoodEntry[] }>('/mood/history'),
    ]);
    setToday(t1.entry);
    setHistory(h.entries);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(k: number) {
    setPending(k);
    const { entry } = await api.post<{ entry: MoodEntry }>('/mood', { mood: k, tag: tag || undefined, note: note || undefined });
    setToday(entry);
    setPending(null);
    load();
  }

  const now = new Date();
  const cells = useMemo(() => monthGrid(now.getUTCFullYear(), now.getUTCMonth()), []);
  const byDate = useMemo(() => new Map(history.map((e) => [e.date, e])), [history]);
  const monthPrefix = now.toISOString().slice(0, 7);

  const avg = useMemo(() => {
    const inMonth = history.filter((e) => e.date.startsWith(monthPrefix));
    if (!inMonth.length) return null;
    return (inMonth.reduce((s, e) => s + e.mood, 0) / inMonth.length).toFixed(1);
  }, [history, monthPrefix]);

  return (
    <Screen title={t('moodTitle')} kicker={t('moodKicker')} nav>
      <Section>
        {today ? (
          <div className="mood-today-set">
            <span className="mood-today-emoji">{MOODS.find((m) => m.k === today.mood)?.emoji}</span>
            <div>
              <p className="mood-today-label">{t(MOODS.find((m) => m.k === today.mood)!.labelKey)}</p>
              {today.tag && <p className="mood-today-tag">{today.tag}</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="mood-picker">
              {MOODS.map((m) => (
                <button key={m.k} className="mood-picker-btn" disabled={pending !== null} onClick={() => save(m.k)}>
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-picker-label">{t(m.labelKey)}</span>
                </button>
              ))}
            </div>
            <div className="mood-chip-list">
              {TAG_KEYS.map((key) => (
                <button key={key} className={`quit-chip ${tag === t(key) ? 'quit-chip-on' : ''}`} onClick={() => setTag(tag === t(key) ? '' : t(key))}>
                  {t(key)}
                </button>
              ))}
            </div>
            <Field label={t('moodNoteLabel')}>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('moodNotePlaceholder')} />
            </Field>
          </>
        )}
      </Section>

      <Section title={`${t('moodThisMonth')}${avg ? ` · ${t('moodAvgSuffix')} ${avg}` : ''}`}>
        <div className="mood-cal-dow">
          {DOW.map((d, i) => (
            <span key={i}>{d[0]}</span>
          ))}
        </div>
        <div className="mood-cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <span key={i} className="mood-cal-cell mood-cal-empty" />;
            const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
            const entry = byDate.get(dateStr);
            const isToday = d === now.getUTCDate();
            return (
              <span key={i} className={`mood-cal-cell ${isToday ? 'mood-cal-today' : ''}`}>
                <span className="mood-cal-day">{d}</span>
                {entry && <span className={`mood-cal-dot mood-cal-m${entry.mood}`} />}
              </span>
            );
          })}
        </div>
      </Section>

      <Section title={t('moodRecent')}>
        {history.length === 0 ? (
          <p className="today-empty">{t('moodNoEntries')}</p>
        ) : (
          history.slice(0, 8).map((e) => (
            <div key={e.date} className="detail-history-row">
              <span className="detail-history-date">{e.date}</span>
              <span className="detail-history-value">
                {MOODS.find((m) => m.k === e.mood)?.emoji} {e.tag || ''}
              </span>
            </div>
          ))
        )}
      </Section>
    </Screen>
  );
}
