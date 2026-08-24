# WINTERWORK — SCREEN CONTRACTS

Each screen has a single primary job.

| Screen | Primary job | Primary action | Density |
|---|---|---|---|
| Welcome | explain product/value | Begin | low |
| Sign in | authenticate | Continue | low |
| Create account | create identity | Create account | low |
| Forgot password | recover access | Send link | low |
| Onboarding | personalize product | Continue | low |
| Today | decide what to do now | next best action | medium |
| Habits | manage daily habits | complete/add | medium |
| Quit counter | understand current quit streak | log/recover | low-medium |
| Habit detail | inspect/edit one habit | edit/save | medium |
| Mood | quick emotional check-in | save | low |
| Focus | start a focused session | Start | low |
| Focus history | understand focus history | inspect period | medium |
| Progress | understand improvement | inspect insight | high |
| Program detail | understand training program | start/continue | medium |
| Profile | identity and summary | edit | low-medium |
| Settings | configure app | change setting | medium |
| Fitness setup | configure training | continue/save | low-medium |
| Training | choose/continue training | start session | medium-high |
| Exercise | understand exercise | log/use | medium |
| Plan detail | inspect plan | start | medium |
| Active session | execute workout | log set | low-medium |
| Session summary | understand result | finish/continue | low-medium |
| Nutrition | manage daily nutrition | log | medium |
| Street | explore/search/filter content | select result | high |

For every screen, Claude must create:
- default;
- loading;
- empty if applicable;
- error if applicable;
- offline if applicable;
- success/completion if applicable;
- mobile variant;
- desktop variant.
