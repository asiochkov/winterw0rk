import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, Field, Input } from '../../components/ui';
import '../quit.css';

const PRESETS = ['Smoking', 'Alcohol', 'Vaping', 'Sugar', 'Fast Food', 'Social Media', 'Gambling', 'Porn'];

export default function AddQuit() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [kind, setKind] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [dailyAmount, setDailyAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await api.post('/quit', {
        kind,
        unitCost: Number(unitCost) || 0,
        dailyAmount: Number(dailyAmount) || 0,
      });
      navigate('/quit');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('quitStartError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={t('quitAddCounterTitle')} nav={false}>
      <div className="form-stack">
        <Field label={t('quitWhatQuitting')}>
          <Input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Smoking" />
        </Field>
        <div className="quit-chip-list">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={`quit-chip ${kind === p ? 'quit-chip-on' : ''}`} onClick={() => setKind(p)}>
              {p}
            </button>
          ))}
        </div>
        <Field label={t('quitCostPerUnit')} hint={t('quitCostPerUnitHint')}>
          <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0.50" />
        </Field>
        <Field label={t('quitUnitsPerDay')} hint={t('quitUnitsPerDayHint')}>
          <Input type="number" value={dailyAmount} onChange={(e) => setDailyAmount(e.target.value)} placeholder="10" />
        </Field>
        {error && <p className="onb-error">{error}</p>}
        <Button full disabled={!kind.trim() || busy} onClick={submit}>
          {busy ? t('quitStartingBtn') : t('quitStartCounterBtn')}
        </Button>
        <Button full variant="ghost" onClick={() => navigate('/quit')}>
          {t('cancel')}
        </Button>
      </div>
    </Screen>
  );
}
