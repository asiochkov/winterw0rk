import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Button, ProgressBar, Section } from '../components/ui';
import './programs.css';

interface Program {
  id: string;
  name: string;
  kind: string;
  lengthDays: number;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentDay: number;
}

export function ProgramsList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[] | null>(null);

  useEffect(() => {
    api.get<{ programs: Program[] }>('/programs').then((r) => setPrograms(r.programs));
  }, []);

  if (!programs) return <Screen title={t('programsTitle')} nav>{null}</Screen>;

  return (
    <Screen title={t('programsTitle')} kicker={t('programsKicker')} nav>
      <div className="prog-cards">
        {programs.map((p) => (
          <button key={p.id} className="prog-card" onClick={() => navigate(`/programs/${p.id}`)}>
            <div className="prog-card-top">
              <p className="prog-card-name">{p.name}</p>
              <span className="prog-card-kind">{p.kind}</span>
            </div>
            <p className="prog-card-desc">{p.description}</p>
            {p.status !== 'not_started' && (
              <div style={{ marginTop: 10 }}>
                <ProgressBar value={(p.currentDay / p.lengthDays) * 100} />
                <p className="prog-card-progress">
                  {t('programDay', { day: p.currentDay, total: p.lengthDays })} {p.status === 'completed' ? t('programCompletedSuffix') : ''}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </Screen>
  );
}

export function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [program, setProgram] = useState<Program | null>(null);

  async function load() {
    const r = await api.get<{ program: Program }>(`/programs/${id}`);
    setProgram(r.program);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function start() {
    await api.post(`/programs/${id}/start`);
    load();
  }

  async function advance() {
    await api.post(`/programs/${id}/advance`);
    load();
  }

  if (!program) return <Screen nav={false}>{null}</Screen>;

  return (
    <Screen kicker={program.kind} title={program.name} nav={false}>
      <button className="auth-back" onClick={() => navigate('/programs')} style={{ marginBottom: 16 }}>
        ← {t('programsTitle')}
      </button>
      <Section>
        <p style={{ fontSize: 14.5, color: 'var(--mut)', lineHeight: 1.6 }}>{program.description}</p>
      </Section>
      <Section title={t('programLengthDays', { n: program.lengthDays })}>
        <div className="prog-days">
          {Array.from({ length: program.lengthDays }, (_, i) => i + 1).map((d) => (
            <span key={d} className={`prog-day ${d < program.currentDay ? 'prog-day-done' : d === program.currentDay && program.status === 'in_progress' ? 'prog-day-current' : ''}`} />
          ))}
        </div>
      </Section>
      {program.status === 'not_started' && (
        <Button full onClick={start}>
          {t('programStart')}
        </Button>
      )}
      {program.status === 'in_progress' && (
        <Button full onClick={advance}>
          {t('programMarkDay', { day: program.currentDay })}
        </Button>
      )}
      {program.status === 'completed' && <p className="today-mood-set">{t('programComplete')}</p>}
    </Screen>
  );
}
