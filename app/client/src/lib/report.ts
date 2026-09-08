/**
 * The personal report's arithmetic, moved out of Progress.tsx unchanged.
 *
 * The strategic audit called this feature missing and filed it as work to
 * design from scratch; reading the code found it already built and buried at
 * the foot of a secondary tab. So this is a move, not a rewrite: the same
 * comparisons, the same honest handling of nothing-to-compare, so the numbers
 * on the new screen are the numbers the old block produced.
 */
export interface ReportPair {
  before: number;
  now: number;
}

export interface Report {
  halfDays: number;
  discipline: ReportPair;
  focus: ReportPair;
  training: ReportPair;
}

export interface ReportRow {
  dim: string;
  before: string;
  now: string;
  text: string;
  up: boolean;
  muted: boolean;
  read: string;
}

type T = (key: never, vars?: Record<string, string | number>) => string;

/*
 * A change against nothing is not a percentage. Going from 0kg to 2852kg is
 * not "+100%", and 0 minutes against 0 minutes is not "+0%" — both are hollow
 * numbers that read as findings. The first says it is new, the second says
 * there is nothing to compare.
 */
function change(a: number, b: number, suffix: string, t: T) {
  if (a === 0 && b === 0) return { text: t('reportNothingYet' as never), up: true, muted: true };
  if (a === 0) return { text: t('reportFirst' as never), up: true, muted: false };
  const n = Math.round(((b - a) / a) * 100);
  return { text: `${n >= 0 ? '+' : ''}${n}${suffix}`, up: n >= 0, muted: false };
}

function points(a: number, b: number, t: T) {
  if (a === 0 && b === 0) return { text: t('reportNothingYet' as never), up: true, muted: true };
  const n = b - a;
  return { text: `${n >= 0 ? '+' : ''}${n}${t('reportPoints' as never)}`, up: n >= 0, muted: false };
}

export function reportRowsOf(report: Report, t: T): ReportRow[] {
  return [
    {
      dim: t('reportDiscipline' as never),
      before: `${report.discipline.before}%`,
      now: `${report.discipline.now}%`,
      ...points(report.discipline.before, report.discipline.now, t),
      read: t('reportDisciplineRead' as never, { n: report.halfDays }),
    },
    {
      dim: t('reportFocus' as never),
      before: t('reportMinutes' as never, { n: report.focus.before }),
      now: t('reportMinutes' as never, { n: report.focus.now }),
      ...change(report.focus.before, report.focus.now, '%', t),
      read: t('reportFocusRead' as never, { n: report.halfDays }),
    },
    {
      dim: t('reportTraining' as never),
      before: t('reportKg' as never, { n: report.training.before }),
      now: t('reportKg' as never, { n: report.training.now }),
      ...change(report.training.before, report.training.now, '%', t),
      read: t('reportTrainingRead' as never, { n: report.halfDays }),
    },
  ];
}
