import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { QuitCounter } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { ErrorState, LoadingRows } from '../../components/states';
import { useAsyncData } from '../../hooks/useAsyncData';
import { Button, EmptyState } from '../../components/ui';
import '../quit.css';

export default function QuitList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const state = useAsyncData(() => api.get<{ counters: QuitCounter[] }>('/quit'));

  if (state.loading) {
    return (
      <Screen title={t('quitTitle')} nav>
        <LoadingRows rows={3} />
      </Screen>
    );
  }
  if (state.error || !state.data) {
    return (
      <Screen title={t('quitTitle')} nav>
        <ErrorState message={state.error ?? t('genericError')} onRetry={state.reload} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }
  const counters = state.data.counters;

  return (
    <Screen title={t('quitTitle')} kicker={t('quitKicker')} nav>
      {counters.length === 0 ? (
        <EmptyState
          title={t('quitEmptyTitle')}
          body={t('quitEmptyBody')}
          action={
            <Button full onClick={() => navigate('/quit/new')}>
              {t('quitStartCounter')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="quit-cards">
            {counters.map((c) => (
              <button key={c.id} className="quit-card" onClick={() => navigate(`/quit/${c.id}`)}>
                <p className="quit-card-days">{c.runDays}</p>
                <p className="quit-card-kind">{c.kind} · {t('quitDaysSuffix')}</p>
                <div className="quit-card-foot">
                  <span>{t('quitBestRun')} {c.bestRunDays}d</span>
                  <span>${c.moneySaved.toFixed(0)} {t('quitSaved')}</span>
                </div>
              </button>
            ))}
          </div>
          <Button full variant="secondary" onClick={() => navigate('/quit/new')} style={{ marginTop: 24 }}>
            {t('add')}
          </Button>
        </>
      )}
    </Screen>
  );
}
