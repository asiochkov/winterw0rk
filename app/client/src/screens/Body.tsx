import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Button, Field, Input, Section } from '../components/ui';

interface BodyEntry {
  date: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  legs: number | null;
}
interface Summary {
  latest: number | null;
  avg7: number | null;
  deltaVs30d: number | null;
}

export default function Body() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<BodyEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  async function load() {
    const [s, h] = await Promise.all([
      api.get<Summary>('/body/summary'),
      api.get<{ entries: BodyEntry[] }>('/body/history'),
    ]);
    setSummary(s);
    setHistory(h.entries);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await api.post('/body', {
      weight: weight ? Number(weight) : undefined,
      chest: chest ? Number(chest) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
    });
    setWeight('');
    setChest('');
    setWaist('');
    setHips('');
    load();
  }

  return (
    <Screen title={t('bodyTitle')} kicker={t('bodyKicker')} nav={false}>
      <Section>
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-n">{summary?.latest ?? '—'}</span>
            <span className="detail-stat-l">{t('bodyLatest')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{summary?.avg7 ?? '—'}</span>
            <span className="detail-stat-l">{t('bodyAvg7')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n" style={{ color: (summary?.deltaVs30d ?? 0) <= 0 ? 'var(--ok)' : 'var(--am)' }}>
              {summary?.deltaVs30d != null ? (summary.deltaVs30d > 0 ? `+${summary.deltaVs30d}` : summary.deltaVs30d) : '—'}
            </span>
            <span className="detail-stat-l">{t('bodyVs30')}</span>
          </div>
        </div>
      </Section>

      <Section title={t('bodyLogToday')}>
        <div className="form-stack">
          <Field label={t('bodyWeightKg')}>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="82.4" />
          </Field>
          <div className="type-row">
            <Field label={t('bodyChest')}>
              <Input type="number" value={chest} onChange={(e) => setChest(e.target.value)} placeholder="—" />
            </Field>
            <Field label={t('bodyWaist')}>
              <Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="—" />
            </Field>
            <Field label={t('bodyHips')}>
              <Input type="number" value={hips} onChange={(e) => setHips(e.target.value)} placeholder="—" />
            </Field>
          </div>
          <Button full onClick={save} disabled={!weight && !chest && !waist && !hips}>
            {t('save')}
          </Button>
        </div>
      </Section>

      <Section title={t('bodyHistory')}>
        {history.length === 0 ? (
          <p className="today-empty">{t('bodyNothingLogged')}</p>
        ) : (
          <div className="detail-history">
            {history.slice(0, 10).map((e) => (
              <div key={e.date} className="detail-history-row">
                <span className="detail-history-date">{e.date}</span>
                <span className="detail-history-value">{e.weight ? `${e.weight}kg` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Screen>
  );
}
