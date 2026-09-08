import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { HeroChip } from '../components/Hero';
import { ReportRows } from '../components/ReportRows';
import { ErrorState, LoadingRows } from '../components/states';
import { useAsyncData, useMutation } from '../hooks/useAsyncData';
import { reportRowsOf, type Report as ReportData } from '../lib/report';
import { DEFAULT_ARC_LENGTH_DAYS } from '../lib/arc';
import type { User } from '../api/types';
import './progress.css';
import './report.css';

interface Overview {
  report: ReportData;
  windowDays: number;
}

/**
 * The end of the arc.
 *
 * Ninety days was the whole frame of the product and nothing happened when it
 * ran out — the counter simply kept going, day 91, day 92, as if the finish
 * line had been a rounding error. A thing you commit to for a season has to
 * end with something, or the commitment was never to anything.
 *
 * Starting the next arc is the one action here, and it is a choice: closing
 * this screen without taking it leaves the finished arc finished.
 */
export default function ArcComplete() {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const state = useAsyncData(() => api.get<Overview>('/progress/overview'));
  const restart = useMutation();

  const length = user?.arcLengthDays ?? DEFAULT_ARC_LENGTH_DAYS;

  async function startNext() {
    const ok = await restart.run(async () => {
      const { user: updated } = await api.post<{ user: User }>('/account/arc/restart', {});
      setUser(updated);
    });
    if (ok) navigate('/today');
  }

  if (state.loading) {
    return (
      <Screen nav={false} back={() => navigate('/today')}>
        <LoadingRows rows={4} />
      </Screen>
    );
  }
  if (state.error || !state.data) {
    return (
      <Screen nav={false} back={() => navigate('/today')}>
        <ErrorState message={state.error ?? t('genericError')} onRetry={state.reload} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }

  return (
    <Screen nav={false} back={() => navigate('/today')}>
      <div className="rep">
        <HeroChip>{t('arcCompleteKicker')}</HeroChip>
        <h1 className="rep-title">{t('arcCompleteTitle', { n: length })}</h1>
        <p className="rep-lede">{t('arcCompleteBody', { n: length })}</p>

        <ReportRows rows={reportRowsOf(state.data.report, t as never)} />

        <div className="rep-actions">
          <button type="button" className="btn btn-primary btn-full" onClick={startNext} disabled={restart.busy}>
            {restart.busy ? t('savingBtn') : t('arcCompleteStartNext')}
          </button>
          <button type="button" className="btn btn-ghost btn-full" onClick={() => navigate('/today')}>
            {t('arcCompleteLater')}
          </button>
        </div>
        {restart.error && <p className="inline-error">{restart.error}</p>}
      </div>
    </Screen>
  );
}
