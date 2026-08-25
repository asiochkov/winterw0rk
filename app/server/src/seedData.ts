import { db } from './db.js';

export const EXERCISES = [
  { id: 'e1', name: 'Barbell Squat', group: 'LEGS', equipment: 'BARBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Bar on the upper back, feet shoulder width. Break at the hips and knees together, descend until the hip crease passes the knee, drive up through mid-foot.', errors: ['Knees collapsing inward', 'Heels lifting off the floor', 'Losing upper-back tightness'] },
  { id: 'e2', name: 'Push-Up', group: 'CHEST', equipment: 'NONE', level: 'BEGINNER', type: 'COMPOUND', cue: 'Hands under the shoulders, body in one line from head to heel. Lower until the chest is a fist off the floor, press back without letting the hips sag.', errors: ['Hips sagging or piking', 'Elbows flaring to 90°', 'Partial range'] },
  { id: 'e3', name: 'Pull-Up', group: 'BACK', equipment: 'BAR', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Hang at full length, shoulders active. Pull the elbows down and back until the chin clears the bar, lower under control.', errors: ['Kipping unintentionally', 'Stopping short of full extension', 'Shrugging at the top'] },
  { id: 'e4', name: 'Overhead Press', group: 'SHOULDERS', equipment: 'BARBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Bar on the front rack, elbows just ahead of the bar. Press vertically, move the head back as the bar passes, lock out overhead.', errors: ['Leaning back through the lower spine', 'Pressing around the head', 'Soft lockout'] },
  { id: 'e5', name: 'Romanian Deadlift', group: 'LEGS', equipment: 'BARBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Soft knees, hinge from the hips, bar close to the legs. Descend until the hamstrings load, stand by driving the hips forward.', errors: ['Rounding the lower back', 'Turning it into a squat', 'Bar drifting away'] },
  { id: 'e6', name: 'Plank', group: 'CORE', equipment: 'NONE', level: 'BEGINNER', type: 'ISOLATION', cue: 'Forearms under the shoulders, ribs down, glutes engaged. Hold one straight line and breathe.', errors: ['Hips too high', 'Holding the breath', 'Neck craned up'] },
  { id: 'e7', name: 'Dumbbell Row', group: 'BACK', equipment: 'DUMBBELL', level: 'BEGINNER', type: 'COMPOUND', cue: 'One hand braced, flat back. Row the dumbbell to the hip, lead with the elbow, lower fully.', errors: ['Twisting the torso', 'Rowing to the chest', 'Using momentum'] },
  { id: 'e8', name: 'Bulgarian Split Squat', group: 'LEGS', equipment: 'DUMBBELL', level: 'ADVANCED', type: 'COMPOUND', cue: 'Rear foot elevated, front shin near vertical. Descend straight down, drive through the front foot.', errors: ['Front foot too close', 'Pushing off the rear leg', 'Torso collapsing forward'] },
  { id: 'e9', name: 'Cable Fly', group: 'CHEST', equipment: 'MACHINE', level: 'INTERMEDIATE', type: 'ISOLATION', cue: 'Slight forward lean, elbows softly bent. Bring the handles together in front of the chest, control the return.', errors: ['Bending the elbows to press', 'Going too heavy', 'Losing the shoulder position'] },
  { id: 'e10', name: 'Lateral Raise', group: 'SHOULDERS', equipment: 'DUMBBELL', level: 'BEGINNER', type: 'ISOLATION', cue: 'Slight bend at the elbow, lead with the elbows out to shoulder height, lower slowly.', errors: ['Swinging the weight', 'Shrugging', 'Raising above the shoulder'] },
  { id: 'e11', name: 'Hanging Leg Raise', group: 'CORE', equipment: 'BAR', level: 'ADVANCED', type: 'ISOLATION', cue: 'Hang tall, tilt the pelvis, raise the legs to hip height or above without swinging.', errors: ['Swinging for momentum', 'Only using the hip flexors', 'Rushing the descent'] },
  { id: 'e12', name: 'Face Pull', group: 'BACK', equipment: 'MACHINE', level: 'BEGINNER', type: 'ISOLATION', cue: 'Rope at eye height, pull toward the face, separate the hands, hold briefly.', errors: ['Too heavy to control', 'Pulling to the chest', 'No pause'] },
  { id: 'e13', name: 'Bench Press', group: 'CHEST', equipment: 'BARBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Shoulder blades pinned, feet planted. Lower the bar to the mid-chest, press up and slightly back to lockout.', errors: ['Bouncing off the chest', 'Flaring elbows to 90°', 'Feet drifting during the press'] },
  { id: 'e14', name: 'Incline Dumbbell Press', group: 'CHEST', equipment: 'DUMBBELL', level: 'BEGINNER', type: 'COMPOUND', cue: 'Bench at 30-45°, dumbbells at chest level. Press up and slightly inward, lower under control.', errors: ['Bench angle too steep', 'Partial lockout', 'Uneven arm paths'] },
  { id: 'e15', name: 'Dips', group: 'CHEST', equipment: 'BAR', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Lean forward slightly, lower until the shoulders dip below the elbows, press back to lockout.', errors: ['Not descending far enough', 'Flaring elbows wide', 'Shrugging the shoulders up'] },
  { id: 'e16', name: 'Deadlift', group: 'BACK', equipment: 'BARBELL', level: 'ADVANCED', type: 'COMPOUND', cue: 'Bar over mid-foot, flat back, chest up. Drive through the floor, hips and shoulders rise together.', errors: ['Hips shooting up first', 'Rounding the lower back', 'Bar drifting away from the shins'] },
  { id: 'e17', name: 'Lat Pulldown', group: 'BACK', equipment: 'MACHINE', level: 'BEGINNER', type: 'COMPOUND', cue: 'Grip slightly wider than shoulders, pull the bar to the upper chest, control the return.', errors: ['Leaning back excessively', 'Using momentum', 'Partial range on the return'] },
  { id: 'e18', name: 'Seated Cable Row', group: 'BACK', equipment: 'MACHINE', level: 'BEGINNER', type: 'COMPOUND', cue: 'Chest tall, pull the handle to the torso, squeeze the shoulder blades, extend fully.', errors: ['Rounding the back at the finish', 'Yanking with momentum', 'Shrugging instead of rowing'] },
  { id: 'e19', name: 'T-Bar Row', group: 'BACK', equipment: 'BARBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Hinge at the hips, flat back, row the handle to the sternum, lower under control.', errors: ['Standing too upright', 'Using the lower back to heave', 'Short range of motion'] },
  { id: 'e20', name: 'Front Squat', group: 'LEGS', equipment: 'BARBELL', level: 'ADVANCED', type: 'COMPOUND', cue: 'Bar on the front shoulders, elbows high. Descend keeping the torso upright, drive up through the whole foot.', errors: ['Elbows dropping', 'Leaning forward excessively', 'Heels lifting'] },
  { id: 'e21', name: 'Leg Press', group: 'LEGS', equipment: 'MACHINE', level: 'BEGINNER', type: 'COMPOUND', cue: 'Feet shoulder width on the platform, lower until the knees reach 90°, press through the whole foot.', errors: ['Lower back rounding off the pad', 'Locking the knees hard', 'Feet too low on the platform'] },
  { id: 'e22', name: 'Walking Lunge', group: 'LEGS', equipment: 'DUMBBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Step forward, lower the rear knee toward the floor, drive through the front heel to the next step.', errors: ['Front knee travelling past the toes', 'Short, choppy steps', 'Torso leaning forward'] },
  { id: 'e23', name: 'Leg Curl', group: 'LEGS', equipment: 'MACHINE', level: 'BEGINNER', type: 'ISOLATION', cue: 'Hips pinned to the pad, curl the heels toward the glutes, lower slowly.', errors: ['Hips lifting off the pad', 'Using momentum', 'Rushing the eccentric'] },
  { id: 'e24', name: 'Calf Raise', group: 'LEGS', equipment: 'MACHINE', level: 'BEGINNER', type: 'ISOLATION', cue: 'Balls of the feet on the edge, rise fully onto the toes, lower until a stretch is felt.', errors: ['Bouncing at the bottom', 'Partial range at the top', 'Bent knees throughout'] },
  { id: 'e25', name: 'Goblet Squat', group: 'LEGS', equipment: 'DUMBBELL', level: 'BEGINNER', type: 'COMPOUND', cue: 'Hold the dumbbell at the chest, squat between the knees, keep the chest tall throughout.', errors: ['Rounding the upper back', 'Knees caving inward', 'Heels rising'] },
  { id: 'e26', name: 'Kettlebell Swing', group: 'LEGS', equipment: 'KETTLEBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Hinge at the hips, snap forward to hip extension, let the bell float to chest height.', errors: ['Squatting instead of hinging', 'Using the arms to lift', 'Overextending the lower back at the top'] },
  { id: 'e27', name: 'Arnold Press', group: 'SHOULDERS', equipment: 'DUMBBELL', level: 'INTERMEDIATE', type: 'COMPOUND', cue: 'Start palms facing you, rotate outward while pressing overhead, reverse on the way down.', errors: ['Rushing the rotation', 'Arching the lower back', 'Uneven timing between arms'] },
  { id: 'e28', name: 'Upright Row', group: 'SHOULDERS', equipment: 'DUMBBELL', level: 'INTERMEDIATE', type: 'ISOLATION', cue: 'Pull the weight up close to the body, lead with the elbows to about chest height.', errors: ['Pulling too high', 'Swinging the torso', 'Elbows trailing behind the hands'] },
  { id: 'e29', name: 'Rear Delt Fly', group: 'SHOULDERS', equipment: 'DUMBBELL', level: 'BEGINNER', type: 'ISOLATION', cue: 'Hinge forward, slight elbow bend, raise the arms out to the sides, squeeze the shoulder blades.', errors: ['Using the traps to shrug the weight up', 'Standing too upright', 'Swinging for momentum'] },
  { id: 'e30', name: 'Band Pull-Apart', group: 'SHOULDERS', equipment: 'BAND', level: 'BEGINNER', type: 'ISOLATION', cue: 'Arms extended, pull the band apart to the chest, squeeze the shoulder blades together.', errors: ['Bending the elbows to cheat the range', 'Rushing the tempo', 'Shrugging the shoulders'] },
  { id: 'e31', name: 'Barbell Curl', group: 'ARMS', equipment: 'BARBELL', level: 'BEGINNER', type: 'ISOLATION', cue: 'Elbows pinned to the sides, curl to full flexion, lower under control without swinging.', errors: ['Swinging the torso', 'Elbows drifting forward', 'Partial range at the top'] },
  { id: 'e32', name: 'Hammer Curl', group: 'ARMS', equipment: 'DUMBBELL', level: 'BEGINNER', type: 'ISOLATION', cue: 'Neutral grip, curl straight up keeping the elbow fixed, lower slowly.', errors: ['Using momentum', 'Elbow drifting away from the torso', 'Rushing the eccentric'] },
  { id: 'e33', name: 'Triceps Pushdown', group: 'ARMS', equipment: 'MACHINE', level: 'BEGINNER', type: 'ISOLATION', cue: 'Elbows pinned at the sides, extend fully, control the return without letting the elbows flare.', errors: ['Elbows flaring outward', 'Using body weight to push', 'Partial extension'] },
  { id: 'e34', name: 'Skull Crusher', group: 'ARMS', equipment: 'BARBELL', level: 'INTERMEDIATE', type: 'ISOLATION', cue: 'Upper arms vertical, lower the bar toward the forehead, extend back to lockout.', errors: ['Elbows flaring out', 'Moving the upper arms', 'Too heavy to control the lowering'] },
  { id: 'e35', name: 'Dead Bug', group: 'CORE', equipment: 'NONE', level: 'BEGINNER', type: 'ISOLATION', cue: 'Lower back pressed flat, extend opposite arm and leg slowly, return and switch sides.', errors: ['Lower back arching off the floor', 'Moving too fast to stay controlled', 'Holding the breath'] },
  { id: 'e36', name: 'Cable Woodchopper', group: 'CORE', equipment: 'MACHINE', level: 'INTERMEDIATE', type: 'ISOLATION', cue: 'Rotate through the torso from high to low (or low to high), keep the arms relatively straight.', errors: ['Rotating only the arms, not the torso', 'Using too much weight to control', 'Locking the knees during the rotation'] },
];

// weekday: 0 = Monday ... 6 = Sunday
export const DEFAULT_PLAN = [
  { weekday: 0, name: 'Full Body A', exerciseIds: ['e1', 'e2', 'e7', 'e6'] },
  { weekday: 2, name: 'Full Body B', exerciseIds: ['e5', 'e4', 'e3', 'e12'] },
  { weekday: 4, name: 'Full Body C', exerciseIds: ['e8', 'e9', 'e10', 'e11'] },
];

export const PROGRAMS = [
  { id: 'intro', name: 'The First Seven', kind: 'INTRODUCTION', lengthDays: 7, description: 'A short introduction to the format. Three habits, one focus block a day, one mood entry.' },
  { id: 'arc30', name: 'Winter Arc 30', kind: 'DISCIPLINE', lengthDays: 30, description: 'Thirty days of enforced consistency. Escalating habit load, daily focus minimum, weekly review.' },
  { id: 'reset90', name: 'The 90-Day Reset', kind: 'FULL RESET', lengthDays: 90, description: 'Sleep, food, movement, mind. The full arc, structured week by week.' },
  { id: 'trans12', name: 'Winter Arc: 12 Weeks', kind: 'TRANSFORMATION', lengthDays: 84, description: 'Training, nutrition and progress check-ins in one package. The flagship program.' },
];

export function ensureProgramsSeeded() {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO programs (id, name, kind, length_days, description) VALUES (@id, @name, @kind, @lengthDays, @description)'
  );
  const tx = db.transaction(() => {
    for (const p of PROGRAMS) insert.run(p);
  });
  tx();
}

export function ensureExercisesSeeded() {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO exercises (id, name, group_name, equipment, level, type, cue, errors)
     VALUES (@id, @name, @group, @equipment, @level, @type, @cue, @errors)`
  );
  const tx = db.transaction(() => {
    for (const ex of EXERCISES) {
      insert.run({ ...ex, errors: JSON.stringify(ex.errors) });
    }
  });
  tx();
}

export function ensureDefaultPlan(userId: number) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO workout_plan_days (user_id, weekday, name, exercise_ids) VALUES (?, ?, ?, ?)'
  );
  const tx = db.transaction(() => {
    for (const day of DEFAULT_PLAN) {
      insert.run(userId, day.weekday, day.name, JSON.stringify(day.exerciseIds));
    }
  });
  tx();
}
