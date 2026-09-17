# Haflaway Design Language

This is the source of truth for **hub chrome** — the WithJoy-inspired wedding-planner surface that event organizers live in. Canonical screens:

| Screen | File | What it defines |
| --- | --- | --- |
| Event Overview | `src/views/event/EventOverview.vue` | Page split, hero type, info pills, launcher tiles, preview column, primary CTA |
| Event shell | `src/views/event/EventLayout.vue` | Overlay sidebar, nav rows, brand script |
| Send invitations composer | `src/views/event/EventCampaigns.vue` (`.em-drawer--composer`) | Form pills, segmented control, footer actions, live phone preview |
| Select Guests / Edit Campaign / send progress | same file, teleported (`em-sg-*`, `em-dialog--joy`, `em-sp-*`) | Modal language |

If a new control does not look like it could sit on Overview or in the composer without being noticed, it is wrong.

**Not this language:** Login, Register, and older dark-admin pages (gold `#C9A84C`, mint fills, lavender fields, 10px boxes). Those are leftovers. Do not copy them into hub work.

Hub routes today (`isHubRoute` in `EventLayout.vue`): Overview, Guest List, Campaigns / Invitations, Schedule, Budget, Check-ins, Cards, Gallery, Gifts of Love, Payments, Settings.

---

## 1. Personality

Haflaway hub is a **quiet wedding studio**, not a dashboard.

- White paper, charcoal ink, almost no chrome.
- Color lives in **small circular launcher tiles** and in **guest-facing invitation art** — never as the page accent, never as a selected-tab fill, never as a Save button.
- Type is two voices: **Inter** for UI, **Cormorant Garamond / Playfair Display** for ceremony titles.
- Everything that can be a pill is a pill. Everything that can be a circle is a circle. Boxes with 8–10px radius feel like the old app.

Feel words: calm, editorial, generous, precise.  
Anti-feel: admin SaaS, gold luxury, mint marketing, indigo-lavender “light theme” patches.

---

## 2. Surfaces and layout

### Page backgrounds

| Token | Hex | Use |
| --- | --- | --- |
| Paper | `#ffffff` | Primary work surface (Overview left, composer form, dialogs) |
| Ground | `#f8f8f9` | Preview column, composer right canvas |
| Hairline | `#f0f0f2` | Column split, header/footer rails |
| Hover wash | `#f7f7f8` | Tile / row hover |
| Track | `#e9eaee` | Segmented-control trough |

Do not use `#eeeef8`, `#f4f4fd`, or other lavender-tinted grays. They read as a different product.

### Overview split (canonical)

- Left **~55%**: white, padding `40 / 36 / 64 / 48`. Content column `max-width: 580px`.
- Right **~45%**: `#f8f8f9`, left hairline `#f0f0f2`, padding `40 / 48 / 48`. Centered collage + copy + CTA.
- Below `980px`: preview stacks **above** the launcher (mobile first-impression is the art).

### Composer split (canonical)

- Full-viewport white drawer (not a side sheet).
- Header `64px`, footer `72px`, both white with `#f0f0f2` rails.
- Left form on white; right preview on `--cx-ground` (`#f8f8f9`).
- Header title matches Overview: Cormorant, uppercase, tracked.

### Sidebar (overlay, not a permanent rail)

On hub pages the rail is **off-canvas**. Hamburger on the page opens a white 272px drawer.

- Brand fallback: Playfair italic `.joy` at 24px / 700 / `#18181b`.
- Section titles: Inter 13.5 / 700 / `#18181b`.
- Nav row: 38px min-height, 8px radius, 13.5 / 500 / `#374151`.
- Active: `#f4f5f7` fill, 600 weight, **no gold, no left accent bar**.
- Hover: `#f8fafc`.

---

## 3. Color

### Ink

| Role | Hex | Notes |
| --- | --- | --- |
| Display / CTA ink | `#1a1a1a` | Hero titles |
| Strong UI | `#111827` | Close to black; selected segment, Done button |
| Body | `#1f2937` / `#262626` | Default copy, launcher labels |
| Secondary | `#374151` | Pills, field labels (13px / 600) |
| Icon | `#4b5563` → `#6b7280` | Strokes; hover to `#111827` |
| Muted | `#64748b` | Helper text, inactive segment |
| Faint | `#94a3b8` | Placeholders, hints |

### Lines

| Role | Hex |
| --- | --- |
| Field / pill border | `#e5e7eb` |
| Hover border | `#d1d5db` |
| Hairline | `#f0f0f2` / `#f1f5f9` (dialog footer) |

### Actions (ink, not brand color)

| Role | Hex |
| --- | --- |
| Primary fill | `#242424` |
| Primary hover | `#000000` |
| Primary text | `#ffffff` |
| Disabled fill | `#f1f3f5` |
| Disabled text | `#9ca3af` |

Composer / dialog **Save / Send / Done** are charcoal pills. Overview **Preview Website** is the same recipe at a slightly taller size (`13px 40px`, 14.5 / 600).

Ghost **Cancel** is either:

- text-only Inter 14 / 600 / `#111827` (modals: `.em-sg-cancel`), or
- outlined pill 44px, white, `#e5e7eb` border, `#374151` (composer footer).

Never mint, never gold, never `--gold`.

### Where color *is* allowed

**Launcher tiles only** — 58px circles, 135° gradients, white miniature glyphs, drop-shadow `0 4px 14px rgba(0,0,0,0.08)`:

| Tile | Gradient |
| --- | --- |
| Budget | `#14b8a6` → `#0d9488` |
| Guest List | `#5b54fa` → `#3e38d6` |
| Check-ins | `#f59e0b` → `#d97706` |
| Cards | `#34d399` → `#059669` |
| Invitations | `#22d3ee` → `#0891b2` |
| Bulk Messages | `#22c55e` → `#15803d` |
| Schedule | `#a78bfa` → `#6d28d9` |
| Gallery | `#fb7185` → `#e11d48` |
| Gifts of Love | `#f43f5e` → `#be123c` |
| Payments | `#facc15` → `#ca8a04` |

Count badges on tiles: `#2563eb` pill, 10px / 700, white text. This is the one blue in hub chrome.

**Invitation collage** (preview column, WhatsApp mock): warm paper `#faf7f2` / blush `#fff5f6` / slate `#f1f5f9`. Serif names. These are *art*, not UI chrome.

**Status in guest pickers** (Select Guests): small colored dots + counts. Keep them as data, not as the selected-row treatment. Selected row is charcoal box / gray wash.

**Semantic alerts** (composer only): success `#ecfdf5` / `#065f46`; error `#fef2f2` / `#991b1b`. Soft, bordered, 12px radius.

### Forbidden in hub

- `--gold` / `#C9A84C` as fill, border, or focus ring
- WhatsApp brand green as a selected-tab background (the glyph may stay green; the **chip** is white-on-gray track)
- Mint / teal Save buttons
- Light-theme lavender inputs (`#eeeef8`, `#c4c4e0`, indigo inset shadows)
- Gold focus rings (`box-shadow: 0 0 0 3px …gold`)

---

## 4. Typography

Loaded in `index.html`: Inter, Playfair Display, Cormorant Garamond, Great Vibes, Plus Jakarta Sans, JetBrains Mono.

### Inter — all UI

Default stack: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`.

| Use | Size | Weight | Color | Tracking |
| --- | --- | --- | --- | --- |
| Modal title | 20px | 700 | `#111827` | `-0.02em` |
| Hub list title (Invitations bar) | 20px | 700 | `#111827` | `-0.02em` |
| Nav / launcher label | 13.5px | 500 | `#262626` / `#374151` | `-0.01em` |
| Field label | 13px | 600 | `#374151` | `-0.01em` |
| Body / helper | 14px / 12–13px | 400–500 | `#64748b` | 0 |
| Pill / field value | 13–14px | 450–500 | `#374151` | 0 |
| Primary button | 14–14.5px | 600 | white | 0 |
| Underline tabs | 14px | 500, 600 when on | `#6b7280` → `#111827` | 0 |

**Sentence case** on labels: `Campaign`, `Channel`, `To`, `Campaign Name`. Not `CAMPAIGN NAME`.

Uppercase is reserved for **display titles** (hero / composer header) and tiny meta kickers on invitation art (`SAVE THE DATE`, letter-spacing `0.14–0.16em`, 7–8px).

### Cormorant Garamond — ceremony titles

```css
font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif;
font-weight: 500;
letter-spacing: 0.05em–0.06em;
text-transform: uppercase;
color: #1a1a1a;
```

- Overview event name: `clamp(20px, 2vw, 28px)`
- Composer header: `22px`

### Playfair Display — invitation / preview poetry

Italic 15px on collage cards; 26px / 600 on the preview column headline (`Your Wedding Website, Ready to Share`). Mix with Cormorant as fallback.

**Great Vibes:** landing / guest-facing decorative words at **2rem+ only**. Never labels, never buttons, never dialog titles.

**JetBrains Mono:** codes and IDs only.

---

## 5. Shape, space, shadow

### Radius

| Shape | Radius | Examples |
| --- | --- | --- |
| Pill | `9999px` | Info chips, fields 46px tall, segments, CTAs, search |
| Circle | `50%` | Back, close, icon-bare, avatar 32px, launcher 58px |
| Card / modal | `16px` | Select Guests, Edit Campaign |
| Textarea / alert | `12–14px` | Custom message, send result |
| Small square icon | `8px` | Overview share / open (`32×32`) |
| Invitation art | `4px` | Collage cards (paper, not UI) |
| Phone bezel | `17px` outer / `11px` screen | Mock device |

Do **not** use 9–10px rounded rectangles for fields, dialogs, or primary buttons.

### Heights (hit targets)

| Control | Height |
| --- | --- |
| Text / campaign pill field | 46px |
| Segmented option | 36px inside a 3px-padded track |
| Composer Cancel / Send | 44px |
| Modal Done | 40px |
| Icon circle | 32–36px |
| Composer header | 64px |
| Composer footer | 72px |

### Shadows (almost none)

| Use | Shadow |
| --- | --- |
| Pills / fields | `0 1px 2px rgba(0,0,0,0.02)` |
| Active segment | `0 2px 6px rgba(0,0,0,0.06)` |
| Launcher icon | `0 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)` |
| Primary CTA | `0 4px 12px rgba(0,0,0,0.12)`; hover `0 6px 16px` + `translateY(-1px)` |
| Modal | `0 24px 64px rgba(0,0,0,0.2)` |
| Phone mock | `0 16px 34px rgba(0,0,0,0.18)` |

No heavy 50%-black dialog shadows. No gold glow.

### Motion

- UI: `120–160ms ease` (or `cubic-bezier(0.16, 1, 0.3, 1)` for segments / drawer).
- Launcher icon hover: `translateY(-2px) scale(1.03)` with a slightly bouncy curve.
- Sidebar: `260ms` cubic-bezier above.
- Do not bounce dialogs. Do not blur the whole app behind every overlay (composer / guests: **solid dim** `rgba(15, 23, 42, 0.32)`). Send-progress may use a light blur; keep the card opaque white.

---

## 6. Iconography

- Stroke UI icons, 1.8–2.2, round caps. Size 14–19px in chrome, 15px in preview tabs.
- Color inherits gray; hover ink.
- Brand logos in a 32px circle with `#e5e7eb` ring, `#f3f4f6` fallback.
- Launcher glyphs are **tiny white illustrations** on the gradient disc — not the same stroke icons as the header.

---

## 7. Components

Build these once and reuse. Names in the codebase are listed so new UI can copy rather than invent.

### 7.1 Info pill (Overview date / location)

`.eo-pill`

- White, `1px #e5e7eb`, `9999px`, padding `6px 14px`, 13px / 450 / `#374151`
- 14px gray stroke icon
- Max width + ellipsis

Composer **Campaign** readout is the same idea at 46px tall (`.em-custom-camp-display`).

### 7.2 Icon buttons

| Kind | Recipe |
| --- | --- |
| Back | 32px circle, white, `#e5e7eb` border, `#6b7280` |
| Bare (search, settings) | 34px circle, no border, transparent; hover `rgba(0,0,0,0.04)` |
| Square utility | 32px, 8px radius, white + `#e5e7eb` |
| Modal close | 32px circle, `#f8fafc` fill, `#64748b`; hover `#f1f5f9` (`.em-sg-x`) |

### 7.3 Segmented control (the signature switch)

Used on Overview **Website | Invitations** and composer **WhatsApp | SMS** (and Edit Campaign).

```
Track:  #e9eaee, 9999px, padding 3px, gap 2px, no border
Idle:   transparent, 13.5 / 500, #64748b, height 36px
Active: #ffffff, 600, #1e293b, shadow 0 2px 6px rgba(0,0,0,0.06)
```

Active is a **white sliding pill**, never a colored outline.

Underline tabs (Invitations / Messaging header) are the other pattern: transparent, 2.5px `#111827` underline when on. Use those for **page sections**, segmented for **binary choices**.

### 7.4 Launcher tile

Transparent button, 14px radius hover `#f7f7f8`. 58px gradient circle + 13.5 / 500 label. Optional 9px chevron `#71717a`. Grid 3 columns, row-gap 28px, column-gap 20px, max-width 580px.

### 7.5 Fields

**Single-line:** 46px, `9999px`, white, `1px #e5e7eb`, padding `0 16px`, 14px Inter, placeholder `#94a3b8`. Focus: `#d1d5db` border, **no gold ring, no color shift of the fill**.

**Select Recipients:** same 46px pill, but **1.5px `#111827`** border when empty; filled state inverts to `#111827` background / white text (`.em-to-btn`).

**Textarea:** 14px radius, min-height ~96px, same border/focus as fields.

**Selects** (copy previous / library): 32px pills, 12px type, light `color-scheme`.

### 7.6 Primary / secondary buttons

**Primary (page CTA, Send, Save, Done)**  
`#242424` (Done may use `#111827`), white, 600, `9999px`, no border. Hover `#000`, `translateY(-1px)`. Disabled: `#f1f3f5` / `#9ca3af`, no shadow.

Overview CTA: padding `13px 40px`, 14.5px.  
Composer Send: height 44px, padding `0 32px`.  
Modal Done: height 40px, padding `0 22px`.

**Secondary**  
Ghost text or white outlined pill — see §3.

### 7.7 Dialog / modal

Teleport to `body`. Backdrop `.em-sg-backdrop`: `rgba(15,23,42,0.32)`, flex center, `z-index: 1200` (progress `1300`). Close on **backdrop `pointerdown.self`**, not click (avoids Vue retarget flicker). Stop pointerdown on the card.

Card: white, 16px, shadow above, no border.

Header: 20px / 700 title, circular X, padding `18 20 10 24`, **no divider**.

Body: 24px horizontal padding. Labels 13 / 600 / `#374151`.

Footer: hairline `#f1f5f9`, Cancel + black pill, padding `14 20 18`.

Edit Campaign uses `.em-dialog.em-dialog--joy` so global `[data-theme="light"] .em-dialog-*` lavender rules cannot win. **Any teleported hub dialog must include a class that beats those global !important rules** (prefer `html .em-dialog.em-dialog--joy …` or `:not(.em-dialog--joy)` in `style.css`).

Select Guests is a **720×560** two-column card (list + numbered selected names), same family.

Send progress is a **centered non-dismissible** white card, charcoal spinner, no mint bar.

### 7.8 Lists inside modals

Rows are **buttons**, not native checkboxes (stability). 8px-ish box indicator. Selected names on the right are numbered `1. Name`. Status filters always remain clickable even at count 0.

### 7.9 Phone preview

Black bezel `#18181b`, warm paper screen, serif title, tiny black pill CTA. Composer WhatsApp mock follows the same device language as Overview’s phone.

---

## 8. Copy tone

- Short, host-facing, confident: “Watch it land on their phone”, “Select Recipients”, “Preview Website”.
- Helpers in 12px `#94a3b8` / `#64748b`, not legal-gray walls.
- Counts in the UI: `Send to 0`, `Selected 12` — numerals are part of the chrome.
- Swahili placeholders in message fields are welcome; UI chrome stays English unless the product is localized.

---

## 9. Dark mode

Composer defines inverted `--cx-*` tokens for `[data-theme="dark"]`, but **hub pages are authored as light**. Do not introduce a third palette. If a hub screen must work in dark, invert paper/ink using the `--cx-*` set in `EventCampaigns.vue` — still no gold.

---

## 10. Implementation rules

1. **Match Overview first**, then composer, then invent.
2. **Sentence-case Inter labels. Cormorant only for page/composer titles.**
3. **Pills 46 / 9999 for values; segments for 2–3 choices; 16px cards for modals.**
4. **Charcoal CTA. Never `--gold`, never mint, never lavender field fill.**
5. **Teleport + unscoped CSS** for anything that mounts on `body`. Assume `style.css` light-theme `!important` will try to restyle `.em-dialog-*`. Win with a dedicated modifier (`--joy`) and higher specificity.
6. **Close overlays with `pointerdown.self`**, `type="button"` everywhere, Escape + X.
7. **Do not reuse `.em-drawer-send` outside `.em-drawer--composer`** — global light CSS still paints it gold/mint.
8. **Launcher color is the only loud color.** Selected states are white-on-gray or black-on-white.

### New-UI checklist

- [ ] Could this sit on `/overview` without looking like a plugin?
- [ ] Title: Cormorant uppercase *or* Inter 20/700 — pick one system, don’t mix in the same bar
- [ ] Labels 13/600 `#374151`, sentence case
- [ ] Fields 46px pill, white, `#e5e7eb`
- [ ] Binary choice = segmented track `#e9eaee`
- [ ] Primary = `#242424` / `#111827` pill
- [ ] Close = 32px circle
- [ ] Modal = 16px white + `.em-sg-backdrop`
- [ ] No gold focus, no `#eeeef8` fill, no 10px boxes

---

## 11. Token cheat sheet

Copy into new hub CSS (composer already uses `--cx-*`):

```css
--hf-paper:      #ffffff;
--hf-ground:     #f8f8f9;
--hf-line:       #f0f0f2;
--hf-border:     #e5e7eb;
--hf-border-hov: #d1d5db;
--hf-ink:        #1a1a1a;
--hf-ink-ui:     #111827;
--hf-body:       #374151;
--hf-muted:      #64748b;
--hf-faint:      #94a3b8;
--hf-track:      #e9eaee;
--hf-hover:      #f7f7f8;
--hf-cta:        #242424;
--hf-cta-hover:  #000000;
--hf-radius-pill: 9999px;
--hf-radius-card: 16px;
--hf-radius-field: 14px;
--hf-field-h:    46px;
--hf-seg-h:      36px;
--hf-shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.02);
--hf-shadow-seg: 0 2px 6px rgba(0, 0, 0, 0.06);
--hf-shadow-md:  0 24px 64px rgba(0, 0, 0, 0.2);
--hf-dim:        rgba(15, 23, 42, 0.32);
```

Type:

```css
--hf-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--hf-serif: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif;
--hf-display: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
```

---

## 12. Reference quotes from the product

Overview preview column: centered Playfair 26px headline, 14px `#64748b` (max ~36ch), then the charcoal pill CTA.

Composer header: hamburger + Cormorant `SEND INVITATION VIA WHATSAPP` + circular close.

Composer form: Campaign pill → Channel segment → To pill → Template 46px rows.

That stack **is** the language. New screens should feel like another room in the same house, not a different house with the same logo.
