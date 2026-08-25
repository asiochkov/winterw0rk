import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { FocusSessionRecord } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { EmptyState } from '../components/ui';

export default function FocusHistory() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const LABELS: Record<string, string> = { pomodoro: t('focusPomodoro'), deep: t('focusDeep'), custom: t('focusCustom') };
  const [sessions, setSessions] = useState<FocusSessionRecord[] | null>(null);

  useEffect(() => {
    api.get<{ sessions: FocusSessionRecord[] }>('/focus/history').then((r) => setSessions(r.sessions));
  }, []);

  if (!sessions) return <Screen nav={false}>{null}</Screen>;

  return (
    <Screen title={t('focusHistoryTitle')} nav={false}>
      <button className="auth-back" onClick={() => navigate('/focus')} style={{ marginBottom: 16 }}>
        ← {t('focusTitle')}
      </button>
      {sessions.length === 0 ? (
        <EmptyState title={t('focusHistoryEmptyTitle')} body={t('focusHistoryEmptyBody')} />
      ) : (
        <div className="detail-history">
          {sessions.map((s) => (
            <div key={s.id} className="detail-history-row">
              <span className="detail-history-date">
                {LABELS[s.mode]} · {new Date(s.started_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="detail-history-value">{Math.round((s.actual_sec || 0) / 60)}m {s.completed ? '' : t('focusStoppedEarly')}</span>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
