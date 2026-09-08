/**
 * One place that turns a number into money.
 *
 * The quit counters print `moneySaved` on four screens, and each of them had
 * written its own symbol into a template string: `$` on the list, `€` on the
 * detail, `€` again on Today. Same number, three currencies, none of them
 * chosen by the user. Intl does the formatting; the currency comes from the
 * account, so the four screens can no longer disagree.
 */
export function formatMoney(amount: number, lang: string, currency: string): string {
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unknown currency code (an older account, a hand-edited value) must not
    // take the screen down over a label.
    return `${Math.round(amount)} ${currency}`;
  }
}
