/**
 * The eight things the quit screen offers to count.
 *
 * The value is what goes to the server and stays in the database; only the
 * label is translated. Storing the translated word instead would mean a
 * counter started in Russian reads as Russian forever after the interface is
 * switched to English — and would break the milestone lookup, which matches
 * on this value.
 */
export const QUIT_PRESETS = [
  { value: 'Smoking', key: 'quitPresetSmoking' },
  { value: 'Alcohol', key: 'quitPresetAlcohol' },
  { value: 'Vaping', key: 'quitPresetVaping' },
  { value: 'Sugar', key: 'quitPresetSugar' },
  { value: 'Fast Food', key: 'quitPresetFastFood' },
  { value: 'Social Media', key: 'quitPresetSocialMedia' },
  { value: 'Gambling', key: 'quitPresetGambling' },
  { value: 'Porn', key: 'quitPresetPorn' },
] as const;

/** A preset shows in the interface language; anything typed by hand shows as typed. */
export function quitKindLabel(kind: string, t: (key: never) => string): string {
  const preset = QUIT_PRESETS.find((p) => p.value === kind);
  return preset ? t(preset.key as never) : kind;
}
