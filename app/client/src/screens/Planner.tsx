import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { PlannerTask, TaskPriority, TaskRecurrence } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { ErrorState, LoadingRows } from '../components/states';
import { useMutation } from '../hooks/useAsyncData';
import { Button, Input, Pill } from '../components/ui';
import './planner.css';

const DAY_KEYS = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'] as const;
const PRIORITY_KEYS: Record<TaskPriority, 'priorityLow' | 'priorityNormal' | 'priorityHigh'> = {
  low: 'priorityLow',
  normal: 'priorityNormal',
  high: 'priorityHigh',
};
const RECURRENCE_KEYS: Record<TaskRecurrence, 'plannerRepeatNone' | 'plannerRepeatDaily' | 'plannerRepeatWeekly'> = {
  none: 'plannerRepeatNone',
  daily: 'plannerRepeatDaily',
  weekly: 'plannerRepeatWeekly',
};

export default function Planner() {
  const { t } = useLanguage();
  const DAYS = DAY_KEYS.map((k) => t(k));
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [tab, setTab] = useState<'week' | 'backlog'>('week');
  const [title, setTitle] = useState('');
  const [addTo, setAddTo] = useState<number | 'backlog'>(0);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [subInput, setSubInput] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mutation = useMutation();

  async function load() {
    setLoadError(null);
    try {
      const r = await api.get<{ tasks: PlannerTask[] }>('/planner');
      setTasks(r.tasks);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask() {
    if (!title.trim()) return;
    const ok = await mutation.run(() =>
      api.post('/planner', {
        title,
        backlog: addTo === 'backlog',
        weekday: addTo === 'backlog' ? null : addTo,
      })
    );
    // The box is only emptied once the task exists; clearing first threw away
    // what the user had typed whenever the request failed.
    if (!ok) return;
    setTitle('');
    load();
  }

  async function toggleDone(tsk: PlannerTask) {
    if (await mutation.run(() => api.patch(`/planner/${tsk.id}`, { done: !tsk.done }))) load();
  }

  async function setPriority(tsk: PlannerTask, priority: TaskPriority) {
    if (await mutation.run(() => api.patch(`/planner/${tsk.id}`, { priority }))) load();
  }

  async function setRecurrence(tsk: PlannerTask, recurrence: TaskRecurrence) {
    if (await mutation.run(() => api.patch(`/planner/${tsk.id}`, { recurrence }))) load();
  }

  async function moveTo(tsk: PlannerTask, weekday: number | null) {
    if (!(await mutation.run(() => api.patch(`/planner/${tsk.id}`, { weekday, backlog: weekday === null })))) return;
    load();
    setMenuFor(null);
  }

  async function remove(tsk: PlannerTask) {
    if (!(await mutation.run(() => api.delete(`/planner/${tsk.id}`)))) return;
    load();
    setMenuFor(null);
  }

  async function addSubtask(tsk: PlannerTask) {
    const v = subInput[tsk.id];
    if (!v?.trim()) return;
    if (!(await mutation.run(() => api.post(`/planner/${tsk.id}/subtasks`, { title: v })))) return;
    setSubInput((s) => ({ ...s, [tsk.id]: '' }));
    load();
  }

  async function toggleSubtask(id: number, done: boolean) {
    if (await mutation.run(() => api.patch(`/planner/subtasks/${id}`, { done }))) load();
  }

  if (loading) {
    return (
      <Screen title={t('plannerTitle')} nav>
        <LoadingRows rows={4} />
      </Screen>
    );
  }
  if (loadError) {
    return (
      <Screen title={t('plannerTitle')} nav>
        <ErrorState
          message={loadError}
          onRetry={() => {
            setLoading(true);
            load();
          }}
          retryLabel={t('tryAgain')}
        />
      </Screen>
    );
  }

  const backlog = tasks.filter((tsk) => tsk.backlog);
  const byDay = (d: number) => tasks.filter((tsk) => !tsk.backlog && tsk.weekday === d);
  const visible = tab === 'backlog' ? [{ label: t('plannerBacklogLabel'), items: backlog }] : DAYS.map((label, i) => ({ label, items: byDay(i) }));

  return (
    <Screen title={t('plannerTitle')}>
      <div className="type-row" style={{ marginBottom: 16 }}>
        <button className={`type-btn ${tab === 'week' ? 'type-btn-on' : ''}`} onClick={() => setTab('week')}>
          {t('plannerWeek')}
        </button>
        <button className={`type-btn ${tab === 'backlog' ? 'type-btn-on' : ''}`} onClick={() => setTab('backlog')}>
          {t('plannerBacklog', { n: backlog.length })}
        </button>
      </div>

      <div className="planner-add">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('plannerNewTask')} />
        <select className="planner-select" value={addTo} onChange={(e) => setAddTo(e.target.value === 'backlog' ? 'backlog' : Number(e.target.value))}>
          {DAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
          <option value="backlog">{t('plannerBacklogLabel')}</option>
        </select>
        <Button onClick={addTask}>{t('add')}</Button>
      </div>

      {visible.map((group) => (
        <div key={group.label} className="planner-day">
          <p className="planner-day-label">{group.label}</p>
          {group.items.length === 0 ? (
            <p className="today-empty">{t('plannerNothingHere')}</p>
          ) : (
            group.items.map((tsk) => (
              <div key={tsk.id} className={`planner-task ${tsk.priority === 'high' ? 'planner-task-high' : ''}`}>
                <div className="planner-task-row">
                  <button className={`today-check ${tsk.done ? 'today-check-on' : ''}`} onClick={() => toggleDone(tsk)} />
                  <span className={`planner-task-title ${tsk.done ? 'planner-task-done' : ''}`}>{tsk.title}</span>
                  {tsk.recurrence !== 'none' && <Pill tone="ac">{t(RECURRENCE_KEYS[tsk.recurrence])}</Pill>}
                  <button className="today-link" onClick={() => setMenuFor(menuFor === tsk.id ? null : tsk.id)}>
                    •••
                  </button>
                </div>

                {tsk.subtasks.length > 0 && (
                  <div className="planner-subtasks">
                    {tsk.subtasks.map((s) => (
                      <label key={s.id} className="planner-subtask">
                        <input type="checkbox" checked={s.done} onChange={(e) => toggleSubtask(s.id, e.target.checked)} />
                        <span className={s.done ? 'planner-task-done' : ''}>{s.title}</span>
                      </label>
                    ))}
                  </div>
                )}

                {menuFor === tsk.id && (
                  <div className="planner-menu">
                    <p className="field-label">{t('plannerPriority')}</p>
                    <div className="type-row">
                      {(['low', 'normal', 'high'] as TaskPriority[]).map((p) => (
                        <button key={p} className={`type-btn ${tsk.priority === p ? 'type-btn-on' : ''}`} onClick={() => setPriority(tsk, p)}>
                          {t(PRIORITY_KEYS[p])}
                        </button>
                      ))}
                    </div>
                    <p className="field-label" style={{ marginTop: 10 }}>
                      {t('plannerRepeat')}
                    </p>
                    <div className="type-row">
                      {(['none', 'daily', 'weekly'] as TaskRecurrence[]).map((r) => (
                        <button key={r} className={`type-btn ${tsk.recurrence === r ? 'type-btn-on' : ''}`} onClick={() => setRecurrence(tsk, r)}>
                          {t(RECURRENCE_KEYS[r])}
                        </button>
                      ))}
                    </div>
                    <p className="field-label" style={{ marginTop: 10 }}>
                      {t('plannerMove')}
                    </p>
                    <div className="mood-chip-list">
                      {DAYS.map((d, i) => (
                        <button key={i} className="quit-chip" onClick={() => moveTo(tsk, i)}>
                          {d}
                        </button>
                      ))}
                      <button className="quit-chip" onClick={() => moveTo(tsk, null)}>
                        {t('plannerBacklogLabel')}
                      </button>
                    </div>
                    <div className="planner-sub-add">
                      <Input
                        value={subInput[tsk.id] || ''}
                        onChange={(e) => setSubInput((s) => ({ ...s, [tsk.id]: e.target.value }))}
                        placeholder={t('plannerAddSubtask')}
                      />
                      <Button variant="secondary" onClick={() => addSubtask(tsk)}>
                        +
                      </Button>
                    </div>
                    <Button full variant="danger" onClick={() => remove(tsk)} style={{ marginTop: 10 }}>
                      {t('plannerDeleteTask')}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ))}
    </Screen>
  );
}
