# Help standards

How the in-app help (使い方) is organised, written and styled. Goal: a casual user gets the answer to "how do I…?" in a few taps, in their own words, without knowing the app's screen names.

- The `help-content-style` skill keeps the sentence-level rules (exact labels, `※`, bold lead-ins). Where it disagrees with this document, this one wins and the skill should be updated.
- Background and reasoning: [help-page-review.md](help-page-review.md). Mockups: [help-page-mockups.html](help-page-mockups.html).

## Readers and what they can do

| State | Can do | Needs from help |
|---|---|---|
| Solo (no invite link) | Everything, on this device only | Data lives in this browser; how to back it up and move it |
| Team, not logged in | View published charts (password-protected ones need the password); edit a local copy | Find yourself, see changes, PDF |
| 閲覧者 | Same, with no password prompts | Same |
| 編集者 | Also 公開する (⚙ panel) and the 名簿 | Workflow, concepts, publishing, not losing work |
| 管理者 | Also ユーザー管理 | Invite, roles, remove |

Gates: `canUseRoster` and the `hasPassword && !isLoggedIn` checks in `HomePage.tsx`; publishing at `ChoreoEditPage.tsx:911`; `App.tsx` for the 名簿 and admin modes. Re-check them when roles change.

Dancers are the largest group. Write for them first.

## One help sheet

- Help is **one full-height sheet** that opens over the current screen. Closing it returns the user exactly where they were, with the chart, selection and undo history untouched.
- The `help` page mode and `HelpPage.tsx` are retired. Every entry point opens the same sheet.
- `openHelp({ group?, article? })` opens it at a group or an article.

### Entry points

| Screen | Entry | Opens at |
|---|---|---|
| Home | 🔰 button (already there) | 🔰 はじめての方へ for a first-time user, the contents otherwise |
| Home | ⓘ → ガイドを見る (already there) | Contents |
| View mode | 🔰 at the top left of the stage, in the same stack as the 前回からの変更 button (`MainStage.tsx`) | 隊列表を見る |
| Edit mode | 🔰 at the top left of the stage, above the メモ button | 隊列表を作る・編集する |
| 名簿, new choreo | "使い方を見る" link in empty states | The matching article |

No new header icons.

## Structure: two levels

**Contents → article.** No in-between group pages.

### Contents

1. **🔰 はじめての方へ** walkthrough card, at the top for users who haven't opened help before.
2. **Groups that apply to this reader**, open, with every article listed:
   - 隊列表を見る — find yourself, sections, what changed, notes, PDF
   - 隊列表を作る・編集する — create, add, place, sections, counts, movement, save, publish
   - チームで使う — join, log in, 名簿, members
3. **困ったとき**, always open.
4. **ほかの役割の方向け**, collapsed: groups that don't apply to this reader. Never hide them; people help each other.
5. **用語**, collapsed.

Group order by state:

| State | Open groups, in order |
|---|---|
| Solo | 隊列表を見る, 隊列表を作る・編集する; チームで使う shrinks to one article, チームで共有するには |
| Team, not logged in / 閲覧者 | 隊列表を見る |
| 編集者 | 隊列表を作る・編集する, 隊列表を見る, チームで使う (名簿) |
| 管理者 | Same as 編集者, with チームで使う including members |

- Within a group, order articles by how often people need them.
- Aim for 10 or fewer per group. More than that means some should merge.
- **Search** is a 🔍 icon in the sheet header, not the first thing on the page. It matches titles, summaries and `keywords`. With no match, show "見つかりませんでした" plus 困ったとき and the groups. Never a bare 0件.

### Article types

| Type | Use for | Shape |
|---|---|---|
| Task | One thing to do | Answer line, diagram (optional), steps, 関連 |
| Concept | Something not visible on screen: セクション, アクションとカウント, 動線, 編集版と公開版, この端末に保存 | Answer line, diagram, 2–4 short points, 関連 |
| Trouble | A symptom (困ったとき) | Symptom as title, likely cause as the answer line, fix steps |
| Walkthrough 🔰 | The big picture for one role | Ordered stages, each linking to its task article |

Two walkthroughs:
- **見る人向け**, absorbing today's はじめての方へ dialog.
- **作る人向け:** 舞台 → ダンサー・道具 → セクション → 配置 → カウント → 公開.

### Article rules

- **Title:** the task or symptom in the user's words: 自分の立ち位置を確認する, not 詳細パネル.
- **Context line:** which screen it happens on (閲覧モードで), once, under the title. Steps start from that screen, so there's no "open the chart from home" step.
- **Answer line first.** Someone who stops reading there still knows what to do.
- **Steps:** at most about 8, numbered, with exact on-screen labels.
- **関連:** up to 3 links.
- **Role tags** (`Tag`, primary or grey: 編集者 / 管理者 / ログインが必要) appear **only on articles shown under ほかの役割の方向け**, where they explain why the reader doesn't see this on their screen.

## What to include

- The main task on each screen.
- Concepts the UI doesn't show.
- **Gates that look like bugs:** no 公開する, 名簿 missing, password prompts, buttons disabled at a limit (5 アクション, 16 カウント).
- **Anything that can lose work:** leaving without saving, conflicts, data only in this browser.
- **Keyboard shortcuts for editors on desktop:** ⌘/Ctrl + Z, Y, S, C, V (`ChoreoEditPage.tsx`).

## Edge cases

Help has no 詳しく block. Conditions, limits and edge cases that a reader doesn't need to finish the task belong in developer documentation (`docs/help-edge-cases.md`), not in the app. Keep a limit or condition in an article only when it explains something the reader would otherwise think is broken (see "What to include").

## What to leave out

- Lists that copy a menu's items (重なり順, 選択の補助機能).
- Effects the user sees straight away ("保存するまで反映されません").
- Descriptions of what's on screen (カードの情報, a five-level 詳細パネル).
- App and build info: it belongs in the ⓘ dialog, not help.
- Internals: version numbers, how sync works, IDs.
- Hidden developer tools. If ever needed, mention them only inside a 困ったとき "不具合を報告する" entry.

## Brand and visuals

Help is built from the app's own parts, so it looks like the app and follows its theme.

- **Tokens only:** `primary`, `primary-fill`, `app`, `surface`, `subtle`, `line`, `muted`, `faint`. No new colours. Use `primary-fill` for red behind white text (it's darker in dark mode so the text stays readable), `primary` for red text, lines and outlines. Red is an accent, never a large fill. Colour beyond that comes only from dancers (the `rainbow` palette). Dark mode works because everything uses tokens.
- **Icons:** Material Symbols Rounded, through `Icon`.
- **Shapes:** `rounded-md` everywhere. No pills.
- **Components:**
  - contents groups use `ExpandableSection` level 1 (the thin grey bars with a small red label, like the years on home), with the article count as a grey `Tag` in `titleExtra`;
  - role tags use `Tag`;
  - links and actions use `IconLabelButton`.
- **Step numbers** are red filled circles with white numbers, like the position markers on the stage edge.
- **Answer line:** bold body text with a 3px `primary` bar on the left, like the stage's centre line. No tinted box.
- **Inline controls:** when a step names a button, render the real control small (`Icon`, `Tag`, a section-bar button, the count strip `InlineStrip`) instead of describing it. It stays correct when the UI changes.
- **Diagrams, not screenshots:** small SVG stages in the app's language:
  - dashed grid, dashed red centre line, red ▼ at the front;
  - coloured dancer circles with names, the reader's own dancer ringed in red;
  - dashed arrows for 動線.
  - Use theme colours (`colorPalette` structural colours for the stage). Screenshots only where a control can't be drawn, cropped tight.
- **🔰** marks the walkthroughs and the view-mode entry, matching the home button.
- **Voice:** です/ます, short and warm. No ♡ in articles; it can stay in the 🔰 welcome.

## Data shape

```ts
type HelpArticle = {
  id: string;
  type: "task" | "concept" | "trouble" | "walkthrough";
  group: "view" | "edit" | "team" | "trouble" | "terms";
  title: string;
  context?: string;            // 閲覧モードで
  roles?: ("editor" | "admin" | "loggedIn")[];
  summary: string;             // answer line, plain text (searchable)
  diagram?: ReactNode;
  steps?: ReactNode[];
  points?: ReactNode[];        // concept
  related?: string[];
  keywords: string[];          // plain text for search: 位置, どこ, 自分
};
```

## Maintenance

- A feature change updates its articles, any trouble entry it affects, and its diagram.
- A new feature gets:
  - an article in the right group, with keywords;
  - `roles` if it's gated;
  - an entry point if it's a main task on its screen.
- Checklist:
  - [ ] Title is a task or symptom in plain words
  - [ ] Context line, and steps start from that screen
  - [ ] Answer line answers it alone
  - [ ] Labels match the screen exactly, with real controls inline
  - [ ] Nothing from "leave out"
  - [ ] `roles` set if gated
  - [ ] Keywords include words a user would type
  - [ ] Looks right in dark mode
