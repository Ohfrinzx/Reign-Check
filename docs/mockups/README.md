# Mockups

Open any of these directly in a browser. They are self-contained, use no
JavaScript, and load self-hosted fonts from `fonts/`.

| File | Direction | One line |
|---|---|---|
| `skin-poster.html` | **Poster** | Cream newsprint, huge condensed black headlines, red diagonal, flat blocks. State printing office. |
| `skin-manila.html` | **Manila** | Buff desk, manila folders, typewriter labels, carbon-copy slips, rubber stamps. Paperwork. |
| `skin-bureau.html` | **Bureau** | Warm off-white, white cards with soft shadows, olive/mustard/brick. 1960s institutional report. |
| `desk.html` | *Superseded* | The original dark version. Kept only to show what was rejected. |

## Layout variants — all in the chosen Poster skin

`poster.css` holds the shared design tokens and components. Every layout below
imports it, so they are true variants of one design system, not separate
designs. Same copy in all four.

| File | Layout | Idea |
|---|---|---|
| `layout-1-broadsheet.html` | **Broadsheet** | The interface *is* a newspaper front page. Masthead with resources, lead story in two columns with a drop cap and pull quote, decision boxed at the foot, standings in the right rail. |
| `layout-2-focus.html` | **Focus** | One card, centred, nothing else. Resources in a thin top bar; factions, warnings and diary collapse to a bottom strip with counts you open on demand. |
| `layout-3-bands.html` | **Bands** | Horizontal stack: masthead, then the document split text-left / options-right, then factions as a row of five, then a warnings-and-diary ticker. |
| `layout-4-table.html` | **The Table** | Three situations face-up; you have time for two. Whatever you leave escalates. **This one changes how a day works** — it is a mechanic, not just an arrangement. |

All three use the identical layout and identical copy, so they are being
judged on look alone.

## Note on the screenshots

Dead space in the middle of some mockups is a placeholder artifact — real runs
carry more diary entries, warnings and prose than the sample does.

## Fonts

`fonts/` holds self-hosted latin subsets (~880KB) of Anton, Archivo Black,
Special Elite, Courier Prime, Libre Franklin, Lora and Oswald, with
`fonts/fonts.css` declaring them.

**When building the real UI, move these into the app** (e.g. `public/fonts/`)
and drop the Google Fonts `<link>` from `index.html`. That also fixes a known
limitation: the game currently falls back to system fonts with no network.
