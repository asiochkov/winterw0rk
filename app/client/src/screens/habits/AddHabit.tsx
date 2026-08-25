import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Habit, HabitType } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, Field, Input } from '../../components/ui';
import '../habits.css';

export default function AddHabit() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const DAYS = [t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')];
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [type, setType] = useState<HabitType>('bool');
  const [schedule, setSchedule] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function toggleDay(i: number) {
    setSchedule(schedule.includes(i) ? schedule.filter((d) => d !== i) : [...schedule, i].sort());
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await api.post<{ habit: Habit }>('/habits', {
        name,
        category,
        type,
        schedule,
        target: type === 'bool' ? undefined : Number(target) || undefined,
        unit: type === 'bool' ? undefined : unit || undefined,
        step: type === 'bool' ? undefined : Number(step) || undefined,
      });
      navigate('/habits');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('addHabitError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={t('addHabitTitle')} nav={false}>
      <div className="form-stack">
        <Field label={t('nameFieldLabel')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cold Shower" />
        </Field>
        <Field label={t('categoryLabel')}>
          <Input value={category} onChange={(e) => setCategory(e.target.value.toUpperCase())} placeholder="BODY" />
        </Field>
        <Field label={t('typeLabel')}>
          <div className="type-row">
            {(['bool', 'count', 'time'] as HabitType[]).map((tp) => (
              <button key={tp} type="button" className={`type-btn ${type === tp ? 'type-btn-on' : ''}`} onClick={() => setType(tp)}>
                {tp === 'bool' ? t('typeBool') : tp === 'count' ? t('typeCount') : t('typeTime')}
              </button>
            ))}
          </div>
        </Field>
        {type !== 'bool' && (
          <div className="type-row">
            <Field label={t('targetLabel')}>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={type === 'time' ? '15' : '2'} />
            </Field>
            <Field label={t('unitLabel')}>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={type === 'time' ? 'MIN' : 'L'} />
            </Field>
            <Field label={t('stepLabel')}>
              <Input type="number" value={step} onChange={(e) => setStep(e.target.value)} placeholder="0.25" />
            </Field>
          </div>
        )}
        <Field label={t('daysLabel')}>
          <div className="day-row">
            {DAYS.map((d, i) => (
              <button key={i} type="button" className={`day-btn ${schedule.includes(i) ? 'day-btn-on' : ''}`} onClick={() => toggleDay(i)}>
                {d[0]}
              </button>
            ))}
          </div>
        </Field>
        {error && <p className="onb-error">{error}</p>}
        <Button full disabled={!name.trim() || schedule.length === 0 || busy} onClick={submit}>
          {busy ? t('savingBtn') : t('addHabitBtn')}
        </Button>
        <Button full variant="ghost" onClick={() => navigate('/habits')}>
          {t('cancel')}
        </Button>
      </div>
    </Screen>
  );
}
