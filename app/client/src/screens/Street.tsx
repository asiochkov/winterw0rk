import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useGeoTracker } from '../hooks/useGeoTracker';
import { RouteMap } from '../components/RouteMap';
import { Screen } from '../components/Shell';
import { Banner, Button, Field, Input, Section } from '../components/ui';
import './training.css';
import './focus.css';
import './street.css';

type Mode = 'run' | 'walk' | 'bike';

interface CardioSession {
  id: number;
  mode: Mode;
  date: string;
  durationSec: number;
  distanceKm: number;
  calories: number;
  source: 'manual' | 'gps';
  elevationGainM: number | null;
}

interface SaveResult {
  distanceKm: number;
  calories: number;
  source: 'manual' | 'gps';
  elevationGainM: number | null;
  splits: { km: number; durationSec: number }[];
  pointsRecorded: number;
  pointsDiscarded: number;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function pace(sec: number, km: number) {
  if (km <= 0) return '—';
  const perKm = sec / km;
  return `${Math.floor(perKm / 60)}:${Math.round(perKm % 60).toString().padStart(2, '0')} /km`;
}

export default function Street() {
  const { t } = useLanguage();
  const geo = useGeoTracker();
  const MODES: { k: Mode; labelKey: 'streetRun' | 'streetWalk' | 'streetBike' }[] = [
    { k: 'run', labelKey: 'streetRun' },
    { k: 'walk', labelKey: 'streetWalk' },
    { k: 'bike', labelKey: 'streetBike' },
  ];
  const [mode, setMode] = useState<Mode>('run');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [distance, setDistance] = useState('');
  const [history, setHistory] = useState<CardioSession[]>([]);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [saveError, setSaveError] = useState('');

  async function loadHistory() {
    const h = await api.get<{ sessions: CardioSession[] }>('/street/history');
    setHistory(h.sessions);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  function startSession() {
    setResult(null);
    setSaveError('');
    setElapsed(0);
    geo.start();
    setRunning(true);
  }

  function finishSession() {
    geo.stop();
    setRunning(false);
    setFinishing(true);
  }

  async function save() {
    setSaveError('');
    const usingGps = geo.points.length >= 2;
    try {
      const r = await api.post<SaveResult>('/street', {
        mode,
        durationSec: elapsed,
        ...(usingGps ? { points: geo.points } : { distanceKm: Number(distance) || 0 }),
      });
      setResult(r);
      setFinishing(false);
      setElapsed(0);
      setDistance('');
      geo.reset();
      loadHistory();
    } catch (err: any) {
      setSaveError(err.message || t('genericError'));
    }
  }

  const gpsBlocked = geo.status === 'denied' || geo.status === 'unavailable';
  const liveKm = geo.liveDistanceM / 1000;

  return (
    <Screen title={t('streetTitle')} nav={false}>
      {!running && !finishing && (
        <>
          <Section title={t('streetMode')}>
            <div className="type-row">
              {MODES.map((m) => (
                <button key={m.k} className={`type-btn ${mode === m.k ? 'type-btn-on' : ''}`} onClick={() => setMode(m.k)}>
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
          </Section>

          {result && (
            <Section>
              <p className="today-mood-set">
                {t('streetSaved', { kcal: result.calories })} · {result.distanceKm} km
                {result.source === 'gps' ? ` · ${t('streetViaGps')}` : ''}
              </p>
              {result.elevationGainM != null && result.elevationGainM > 0 && (
                <p className="tr-meta">{t('streetElevation', { m: result.elevationGainM })}</p>
              )}
              {result.splits.length > 0 && (
                <div className="detail-history" style={{ marginTop: 12 }}>
                  {result.splits.map((s) => (
                    <div key={s.km} className="detail-history-row">
                      <span className="detail-history-date">{t('streetSplitKm', { km: s.km })}</span>
                      <span className="detail-history-value">{fmt(s.durationSec)}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.pointsDiscarded > 0 && (
                <p className="tr-meta" style={{ marginTop: 8 }}>
                  {t('streetPointsFiltered', { kept: result.pointsRecorded, dropped: result.pointsDiscarded })}
                </p>
              )}
            </Section>
          )}

          <Button full onClick={startSession}>
            {t('streetStart', { mode: t(MODES.find((m) => m.k === mode)!.labelKey).toLowerCase() })}
          </Button>
          <p className="tr-meta" style={{ textAlign: 'center', marginTop: 12 }}>
            {t('streetGpsIntro')}
          </p>
        </>
      )}

      {running && (
        <div className="street-active">
          <p className="sess-progress">
            {t(MODES.find((m) => m.k === mode)!.labelKey).toUpperCase()} · {t('streetInProgress')}
          </p>
          <p className="focus-clock">{fmt(elapsed)}</p>

          <div className="street-live-stats">
            <div className="detail-stat">
              <span className="detail-stat-n">{liveKm.toFixed(2)}</span>
              <span className="detail-stat-l">km</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-n" style={{ fontSize: 18 }}>{pace(elapsed, liveKm)}</span>
              <span className="detail-stat-l">{t('streetPace')}</span>
            </div>
          </div>

          {geo.status === 'requesting' && <Banner tone="am">{t('streetGpsRequesting')}</Banner>}
          {geo.status === 'tracking' && (
            <p className="tr-meta" style={{ marginTop: 8 }}>
              {t('streetGpsFix', { n: geo.points.length, acc: geo.accuracy ? Math.round(geo.accuracy) : '—' })}
            </p>
          )}
          {geo.status === 'signal-lost' && <Banner tone="am">{t('streetGpsSignalLost')}</Banner>}
          {gpsBlocked && (
            <Banner tone="dg">
              {geo.status === 'denied' ? t('streetGpsDenied') : t('streetGpsUnavailable')}
            </Banner>
          )}

          {geo.points.length >= 2 && (
            <div style={{ width: '100%', marginTop: 16 }}>
              <RouteMap points={geo.points} height={160} />
            </div>
          )}

          <Button full onClick={finishSession} style={{ marginTop: 24 }}>
            {t('streetFinish')}
          </Button>
        </div>
      )}

      {finishing && (
        <Section title={geo.points.length >= 2 ? t('streetConfirm') : t('streetHowFar')}>
          {geo.points.length >= 2 ? (
            <>
              <RouteMap points={geo.points} />
              <div className="detail-stats" style={{ marginTop: 16 }}>
                <div className="detail-stat">
                  <span className="detail-stat-n">{liveKm.toFixed(2)}</span>
                  <span className="detail-stat-l">km</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-n">{fmt(elapsed)}</span>
                  <span className="detail-stat-l">{t('summaryDuration')}</span>
                </div>
              </div>
              <p className="tr-meta" style={{ marginTop: 8 }}>{t('streetServerRecompute')}</p>
            </>
          ) : (
            <>
              <Field label={t('streetDistance')}>
                <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5.2" autoFocus />
              </Field>
              <p className="today-empty" style={{ marginTop: 8 }}>
                {t('streetNoGpsFallback', { time: fmt(elapsed) })}
              </p>
            </>
          )}
          {saveError && <p className="onb-error">{saveError}</p>}
          <Button full onClick={save} style={{ marginTop: 12 }}>
            {t('streetSaveSession')}
          </Button>
        </Section>
      )}

      {!running && !finishing && (
        <Section title={t('streetHistory')}>
          {history.length === 0 ? (
            <p className="today-empty">{t('streetNoSessions')}</p>
          ) : (
            <div className="detail-history">
              {history.map((h) => (
                <div key={h.id} className="detail-history-row">
                  <span className="detail-history-date">
                    {h.mode} · {h.date} {h.source === 'gps' ? '· GPS' : ''}
                  </span>
                  <span className="detail-history-value">
                    {h.distanceKm}km · {fmt(h.durationSec)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </Screen>
  );
}
