import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { PlannerTask, TaskPriority, TaskRecurrence } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { ErrorState, LoadingRows } from '../components/states';
import { useMutation } from '../hooks/useAsyncData';
import { Button, Input, Pill } from '../components/ui';
import { DayTimeline } from './planner/DayTimeline';
import { WeekTimeline } from './planner/WeekTimeline';
import './planner.css';

type PlannerView = 'day' | 'week' | 'list' | 'backlog';

/** "07:30" to 450. Anything else is treated as no time at all rather than as
 *  midnight, which would silently place the task at the top of the day. */
function parseClock(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

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
  // Day and week are the same calendar at two zoom levels, so the selected day
  // is shared: switching views never loses which day you were looking at.
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [tab, setTab] = useState<PlannerView>(() =>
    typeof window !== 'undefined' && window.innerWidth < 480 ? 'day' : 'week'
  );
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [times, setTimes] = useState({ start: '', end: '' });
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
    const startMin = parseClock(times.start);
    const ok = await mutation.run(() =>
      api.post('/planner', {
        title,
        backlog: addTo === 'backlog',
        weekday: addTo === 'backlog' ? null : addTo,
        startMin,
        // An end time on its own means nothing; a start without an end gets
        // the hour the timeline would draw anyway.
        endMin: startMin == null ? null : (parseClock(times.end) ?? startMin + 60),
      })
    );
    // The box is only emptied once the task exists; clearing first threw away
    // what the user had typed whenever the request failed.
    if (!ok) return;
    setTitle('');
    setTimes({ start: '', end: '' });
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
        <button className={`type-btn ${tab === 'day' ? 'type-btn-on' : ''}`} onClick={() => setTab('day')}>
          {t('plannerDay')}
        </button>
        <button className={`type-btn ${tab === 'week' ? 'type-btn-on' : ''}`} onClick={() => setTab('week')}>
          {t('plannerWeek')}
        </button>
        <button className={`type-btn ${tab === 'list' ? 'type-btn-on' : ''}`} onClick={() => setTab('list')}>
          {t('plannerList')}
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

      {/* Optional: a task with no time still works exactly as it did, and is
          listed above the grid rather than dropped somewhere on it. */}
      {addTo !== 'backlog' && (
        <div className="planner-times">
          <label className="planner-time">
            <span>{t('plannerStartTime')}</span>
            <input
              className="input"
              type="time"
              value={times.start}
              onChange={(e) => setTimes((v) => ({ ...v, start: e.target.value }))}
            />
          </label>
          <label className="planner-time">
            <span>{t('plannerEndTime')}</span>
            <input
              className="input"
              type="time"
              value={times.end}
              onChange={(e) => setTimes((v) => ({ ...v, end: e.target.value }))}
            />
          </label>
        </div>
      )}

      {tab === 'week' && (
        <WeekTimeline
          tasks={tasks}
          dayLabels={DAYS}
          todayIndex={todayIndex}
          onExpandDay={(d) => {
            setSelectedDay(d);
            setTab('day');
          }}
          onOpen={(task) => setMenuFor(menuFor === task.id ? null : task.id)}
          onToggle={toggleDone}
        />
      )}

      {tab === 'day' && (
        <>
          {/* The week strip doubles as the day navigator, so moving between
              days never leaves the day view. */}
          <div className="planner-daystrip">
            <button type="button" className="planner-daystrip-back" onClick={() => setTab('week')}>
              ⌃ {t('plannerBackToWeek')}
            </button>
            <div className="planner-daystrip-days">
              {DAYS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`planner-daystrip-day ${i === selectedDay ? 'is-on' : ''}`}
                  onClick={() => setSelectedDay(i)}
                  aria-current={i === selectedDay ? 'date' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <DayTimeline
            weekday={selectedDay}
            tasks={tasks}
            isToday={selectedDay === todayIndex}
            onOpen={(task) => setMenuFor(menuFor === task.id ? null : task.id)}
            onToggle={toggleDone}
          />
        </>
      )}

      {(tab === 'list' || tab === 'backlog') &&
        visible.map((group) => (
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
