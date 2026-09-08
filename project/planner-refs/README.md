# Planner calendar — the two reference screenshots, written down

`CLAUDE_TASK.md` section 6 specifies a new expandable Day⇄Week timeline for the
Planner and calls two reference screenshots the only source for it. They were
sent in chat as images, not files, so the pixels could not be committed. What
follows is what they show, recorded before it was lost.

**These are screenshots of other products, sent as inspiration.** They are not
Winterwork's design. Nothing here overrides `Winterwork v7.dc.html`: take the
*structure* from these notes and the *visual language* — colours, radii, type,
spacing, motion — from v7 and `app/client/src/styles/tokens.css`.

---

## Reference 1 — phone, dark day timeline

A photo of a phone held in hand. Status bar reads 4:27.

**Header.** A circular hamburger button on the left. Then a week strip: seven
columns, each a one-letter weekday over a date — `M 13 · T 14 · W 15 · T 16 ·
F 17 · S 18 · S 19`. The current day (14) is marked with a small red pin above
the number rather than a filled pill. Far right: a circular ring showing `92`,
the ring drawn in green — a day-completion percentage.

**Time axis.** Down the left edge, hour labels: `2 PM`, `3 PM`, `4 PM`, `5 PM`,
`6 PM`, `7 PM`, `8 PM`, `9 PM`. Interleaved with them are *event* times shown
differently — `1:30`, `5:45`, `8:15` — which sit alongside the insight labels
rather than the hour grid. Small, muted, tabular.

**The energy line.** A thin coloured line runs vertically down the left gutter,
just inside the time labels, and it is *not straight* — it bows and curves
between the insight points, green through the rising stretches and amber/olive
through the dipping ones. It reads as a continuous energy curve for the day,
threading past the event cards.

**Insight labels.** Sitting on the axis, between cards, as small coloured text
with a leading arrow glyph:

| time | label | colour |
| --- | --- | --- |
| 1:30 | end of sleep inertia | olive / amber |
| 4 PM | energy rise | green |
| 5:45 | energy dip | amber |
| 8:15 | energy rise | green |

**Event cards.** Full-width rounded rectangles, one per event, each with a
translucent colour fill carrying a soft left-to-right gradient, and a small
mono-line icon in the top-right corner:

| event | fill | icon |
| --- | --- | --- |
| Morning walk | olive / yellow-green | walking figure |
| Breakfast | blue | wifi-ish glyph |
| Important team call | grey-lavender | window / rectangle |
| Order groceries | green | lightning |
| Study dramaturgy | bright green | — |
| Find project references | green | lightning |
| Climbing | green | — |

Card height tracks duration. Titles are a medium-weight body size; there is no
time text inside the card — the vertical position carries that.

**Buffer rows.** Under some cards (Morning walk, Order groceries, Find project
references) sits a separate thin dark strip reading `⊙ Buffer & rest zone` in
small muted text. It is its own block, not a second line of the card.

**Now line.** A thin red horizontal rule crossing the full width at the current
time, with a small red dot where it meets the axis. In the shot it cuts through
the "Important team call" card.

**FAB.** A round light `+` button, bottom right, floating over the timeline.

---

## Reference 2 — tablet, dark week grid

A photo of a tablet with a keyboard. The app is in German.

**Header.** A segmented control, centred: `Tag | Woche | Monat | Jahr`, with
`Woche` active as a white pill on dark. Above left, a small row of icons —
calendar (red), envelope, list, `+`. Below, a large left-aligned title:
`Februar 2025`.

**Grid.** Column headers give short weekday plus date — `Mo. 3.`, `Di. 4.`,
`Mi. 5.`, `Do. 6.`, `Fr. 7.`, `Sa.` … A single hour axis on the far left serves
all columns (`10:00`, `12:00`, `14:00`, `16:00`, `17:00`, `18:00` visible).
Columns are separated by hairlines.

**Event blocks.** Rounded, saturated-dark fills with brighter text of the same
hue. Title in bold, and under it a small time range with a leading clock glyph
(`⊙ 08:40–11:20`). A repeat glyph sits top-right on recurring items.

| block | colour |
| --- | --- |
| Schule | dark teal-green |
| LERNBLOCK | dark red |
| Stadtbibliothek | olive / gold |
| Planen | blue |
| Geschirr waschen, Duschen, Putzen | grey |

**Attached strips.** Above some blocks sits a separate narrow block —
`⊙ 08:00–13:00`, or `🚗 30 Min. Wegzeit` (travel time) — visually docked to the
event but its own element with its own colour.

Blocks fill nearly the full column width; short ones still show both lines.

---

## What is *not* answered by these shots

- Whether the energy curve is decorative or interactive.
- What happens to an all-day / untimed task in either view.
- Overlapping events — neither shot has two events at the same time, so the
  side-by-side split rule is unspecified.
- The expand/collapse animation itself, which section 6.2.3 describes but
  neither screenshot can show.

Decide these against v7's existing patterns, and record the decision here.

---

## Decisions taken on the open questions

Recorded here as the file asks, after building the timeline.

**The energy curve is not built.** The brief says its data should come from
"the app's existing energy/circadian insight logic, or a new `energyInsights`
service if there is none". There is none, and there is no signal in the data
model — no sleep, no heart rate, no time-of-day performance history — from
which an energy rise or dip could be derived. Drawing the curve would mean
inventing a claim about the user's body and presenting it as a measurement,
which is the same thing as the prototype's hardcoded 92kg bench that was
refused earlier in this transfer. If a real signal appears later (sleep
entries, or completion times per hour accumulated over an arc), the labels
have a place to attach to on the axis.

**Untimed tasks** are listed above the grid under "no time set", not placed on
it. Most tasks have no time; giving them an invented slot would say something
false about when they happen.

**Overlapping events** are drawn stacked in the same lane. Neither reference
shows two at once and the side-by-side split rule is unspecified; stacking is
the honest minimum until there is a rule to follow. Worth revisiting once
enough tasks carry times for overlaps to be common.

**The expand transition** is a view swap, not a shared-element animation. The
week column and the day view do not share a DOM node, and faking the morph
with a scale would move the card away from where its time actually is —
misleading in a calendar for the length of the animation.

**Phone default** is Day, per the composition rule not to shrink a desktop
layout: seven columns at 430px gives each day about 50px, too narrow for a
title. The week grid stays reachable through its own tab and scrolls
horizontally.

**Buffer rows and travel-time strips** from the references are not built —
they need data the model does not have.
