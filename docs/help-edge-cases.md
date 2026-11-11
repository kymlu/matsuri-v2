# Help: edge cases and details

Behaviour that used to be in the in-app help but doesn't help a reader finish a task. It's kept here as a reference for development and support. In-app help follows [help-page-standards.md](help-page-standards.md).

## Home

- **Samples:** a stage sample and a parade sample are always in the list. They can't be published.
- **List:** grouped by year, then event. Only the newest year starts open, unless a search is active.
- **新規作成 from an event's 追加:** the event name and dates are filled in.
- **新規作成 step 3:** up to 150 dancers, and up to 100 of one prop. When the stage is full, dancers are stacked with a small offset.
- **Upload, single chart:** if the name, event and dates match an existing chart, the choice is コピーを作成 (the main button), 上書き or キャンセル.
- **Upload, zip:** everything is imported as new charts with no duplicate check, and one failure doesn't stop the rest.
- **Passwords:** a correct password unlocks a chart on this device until it's next published. Logged-in team members never need it. The password also gates 複製, 隊列情報変更, 共有用エクスポート, PDF and 公開履歴 for users who aren't logged in.
- **公開履歴:** past versions open read-only; they can't be edited or exported as PDF.
- **削除:** only for charts that exist only on this device. **変更を破棄:** only when there are unpublished local changes. Neither can be undone.
- **Event 情報変更:** renames the event and changes its dates for every chart in it.
- **ⓘ:** links to the guide, has お問い合わせ (the ケイティー button opens an email to tairetsu.app@gmail.com, subject お問い合わせ) and shows build info. Double-tapping the editor/viewer title downloads logs for troubleshooting.
- **Welcome (no team link):** explains that joining a team enables saving and publishing, with a メールで問い合わせる button (email to tairetsu.app@gmail.com, subject チームへの参加について).

## View mode

- **First-time hint:** the first time someone opens view mode, a message says to tap a name; it can be turned off with a switch.
- **Detail panel:**
  - it can be dragged to resize;
  - with a dancer selected it switches between 詳細 (position, distance to next position, counts) and まとめ (all sections; no distances or notes; tapping a row switches section);
  - with no dancer selected it lists the section's actions and counts.
- **Notes:** the shared note shows メモなし when empty. The 自分用メモ is stored only on this device and never published.
- **Movement paths:** shown by default. The toggle only works with exactly one dancer selected and no count selected.
- **Changelog:**
  - not shown the first time a chart is opened, or when only colours changed;
  - lists event, stage, sections, notes, dancers, actions, props and obstacles;
  - per-dancer view lists position, count and path changes by section, and dancers with no changes can't be picked.
- **PDF:** not available while viewing a past version.
- **Dancer names on the stage:** up to 3 characters per line and 2 lines, split evenly. Longer names end in … (the first 5 characters). Names with spaces wrap at the space. The full name is unchanged and shows in the rename dialog and dancer list. PDFs use the same split.

## Edit mode

- **＋ (add section):** always copies the last section, wherever you are.
- **複製 (duplicate section):** inserts the copy before the original, keeping its name.
- **Actions and counts:**
  - up to 5 actions per section and 16 counts per action;
  - action and count names must be unique within a section;
  - 自分用メモ from view mode is shown read-only at the bottom of メモ編集.
- **Z-order:** 最前面へ / 前面へ / 背面へ / 最背面へ.
- **Selection helpers:**
  - 障害物選択 and 全部選択 only include obstacles while obstacles are unlocked;
  - 同色選択 and 同名選択 match the same type and colour/name.
- **ダンサー管理:**
  - available with at least one dancer;
  - deleted rows can be restored until 保存;
  - closing without 保存 discards changes;
  - duplicate names warn but don't block saving.
- **Colour assignment:** applies to this section only, later sections, or all sections.
- **Props:**
  - 複製 keeps name, size and colour;
  - prop colour is chart-wide;
  - 使用中／未使用 is per section;
  - resizing past the stage edge moves the prop inside;
  - size is locked by default, and unlocked while adding a prop;
  - 道具サイズ編集 (with only props selected) edits the selection but can't delete.
- **Obstacles:** position locked by default, and unlocked while adding one. They have no movement paths.
- **動線編集:**
  - 点数 switches between 1, 2 and 3 control points, evenly re-spaced (the curve isn't kept);
  - 曲線／直線 toggles curves;
  - リセット makes the path straight.
- **Stage size:**
  - changing the width keeps positions relative to the centre;
  - anything outside the new stage is moved to the edge;
  - stage type changes where 0 is: the top for a stage, the bottom for a parade.
- **Publishing:**
  - passwords are up to 25 characters;
  - if someone published a newer version first, publishing is blocked until the chart is reloaded from home.
- **Version conflict (syncRequired):** コピーして公開版へ / このまま開く / 破棄して公開版へ.

## Exports

- **共有用:** a zip with .mtr files, which can be uploaded again. **PDF:** for reading and printing only.
- **Where:**
  - home (chart menu): both formats;
  - edit mode header: both;
  - view mode header: PDF only;
  - event menu: 共有 for all charts in the event.
- **PDF options:**
  - 全ダンサー分をまとめて出力 makes one PDF per dancer in a zip, named with the dancer first (off by default);
  - the tracked dancer defaults to the selected one;
  - paths follow the current path toggle;
  - 自分用メモ is included by default;
  - PDFs are always in light mode, even when exported from dark mode.

## Team and login

- Invite links fill in the email address. An invalid or expired link shows an error, and the admin has to send a new one.
- Password reset codes last 10 minutes.
- On first login, people without a display name are asked to set one. It's used to auto-select their dancer in view mode.

## 名簿

- **Adding:**
  - one name per line; pasting several lines adds them all;
  - blank lines and repeats are ignored, and full- and half-width forms count as the same name;
  - names over 15 characters stay in the input;
  - the selected category is added, and while filtering, the filter's category is pre-selected;
  - adding an existing name only adds the category.
- **Editing:**
  - a name can't be changed to another existing name;
  - changes never affect existing charts;
  - prop size and colour each have a checkbox, and unticking it clears that value;
  - changing a prop's size or colour doesn't change props already placed.
- **Selection:**
  - すべて選択 selects what's visible;
  - hidden selected names are counted as 「うちN名は非表示」;
  - only bulk delete can be undone (元に戻す).
- **Categories:** deleting a category keeps its names.
- **Using names:**
  - names used by other dancers are listed last as 使用中;
  - typed names don't change a prop's size or colour, only picking from the 名簿 does;
  - in 道具管理, picking a suggestion applies its size and colour;
  - suggestions only show for logged-in editors and admins, and not offline.

## ユーザー管理

- Existing members' addresses can't be invited again.
- Admins can't change their own role or remove themselves.
