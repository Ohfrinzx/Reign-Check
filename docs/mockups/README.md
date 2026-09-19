# Mockups

Open any of these directly in a browser. They are self-contained, use no
JavaScript, and load self-hosted fonts from `fonts/`.

| File | Direction | One line |
|---|---|---|
| `skin-poster.html` | **Poster** | Cream newsprint, huge condensed black headlines, red diagonal, flat blocks. State printing office. |
| `skin-manila.html` | **Manila** | Buff desk, manila folders, typewriter labels, carbon-copy slips, rubber stamps. Paperwork. |
| `skin-bureau.html` | **Bureau** | Warm off-white, white cards with soft shadows, olive/mustard/brick. 1960s institutional report. |
| `desk.html` | *Superseded* | The original dark version. Kept only to show what was rejected. |

All three use the identical layout and identical copy, so they are being
judged on look alone.

## Fonts

`fonts/` holds self-hosted latin subsets (~880KB) of Anton, Archivo Black,
Special Elite, Courier Prime, Libre Franklin, Lora and Oswald, with
`fonts/fonts.css` declaring them.

**When building the real UI, move these into the app** (e.g. `public/fonts/`)
and drop the Google Fonts `<link>` from `index.html`. That also fixes a known
limitation: the game currently falls back to system fonts with no network.
