import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { HeroChip } from '../components/Hero';
import { ReportRows } from '../components/ReportRows';
import { ErrorState, LoadingRows } from '../components/states';
import { useAsyncData } from '../hooks/useAsyncData';
import { useBack } from '../hooks/useBack';
import { reportRowsOf, type Report as ReportData } from '../lib/report';
import { dayOfArc } from '../lib/arc';
import './progress.css';
import './report.css';

interface Overview {
  report: ReportData;
  windowDays: number;
}

/**
 * The personal report, as a place rather than as the bottom of a tab.
 *
 * The comparison itself was already written and already honest about having
 * nothing to compare; what it never had was a moment. It closed a screen
 * people reach when they go looking for it, which is the opposite of the
 * point — the report is the thing that makes a week feel like it counted.
 */
export default function Report() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const back = useBack('/progress');
  const state = useAsyncData(() => api.get<Overview>('/progress/overview'));

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

  const data = state.data;
  const rows = reportRowsOf(data.report, t as never);
  const day = dayOfArc(user?.arcStartDate ?? null);

  return (
    <Screen nav={false} back={back}>
      <div className="rep">
        <HeroChip>{t('reportPeriod', { n: data.windowDays })}</HeroChip>
        <h1 className="rep-title">{t('reportTitle')}</h1>
        <p className="rep-lede">{t('reportIntro', { n: data.report.halfDays })}</p>
        <p className="rep-day">{t('reportArcDay', { n: day })}</p>

        <ReportRows rows={rows} />

        <p className="rep-foot">{t('reportFoot')}</p>
      </div>
    </Screen>
  );
}
