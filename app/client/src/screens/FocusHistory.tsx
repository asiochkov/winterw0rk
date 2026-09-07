import { useEffect, useState } from 'react';
import { useBack } from '../hooks/useBack';
import { api } from '../api/client';
import type { FocusSessionRecord } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { EmptyState } from '../components/ui';

export default function FocusHistory() {
  const back = useBack('/focus');
  const { t } = useLanguage();
  const LABELS: Record<string, string> = { pomodoro: t('focusPomodoro'), deep: t('focusDeep'), custom: t('focusCustom') };
  const [sessions, setSessions] = useState<FocusSessionRecord[] | null>(null);

  useEffect(() => {
    api.get<{ sessions: FocusSessionRecord[] }>('/focus/history').then((r) => setSessions(r.sessions));
  }, []);

  if (!sessions) return <Screen nav={false} back={back}>{null}</Screen>;

  return (
    <Screen title={t('focusHistoryTitle')} nav={false} back={back}>
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
