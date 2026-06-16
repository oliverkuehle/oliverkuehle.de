# AGENTS.md

Personal site of Oliver Kühle — a static site built with **Eleventy (11ty) v3**.
Minimalist by intent: few dependencies, small config, hand-written CSS.

## Commands

```bash
npm run serve   # dev server + live reload (http://localhost:8080)
npm run build   # build to _site/
npm run clean   # rm -rf _site
```

Node 24. Only dependency is `@11ty/eleventy`. `_site/` and `node_modules/` are gitignored.

## Layout

```
eleventy.config.js     # all config: collections, filters, markdown plugins
src/
  index.njk            # homepage: intro + Keywords + Timeline
  keyword.njk          # paginated → one /<keyword>.html page per keyword
  notes/               # full posts (each gets its own page)
    *.md
    notes.11tydata.js  # dir-data: layout + permalink for every note
  redirects/           # link-only entries (no page of their own)
    *.md
    redirects.11tydata.js
  _includes/
    base.njk           # HTML shell (<head>, optional extra `styles`)
    post.njk           # per-note page layout
    note-row.njk       # `noteRow(note)` macro — one list row
  *.css                # main.css, intro.css, variables.css, material-symbols.css
  resources/           # images + fonts (passthrough-copied to /resources)
```

Eleventy dirs: input `src`, output `_site`, includes `_includes`. Template engine
is Nunjucks (`njk`) for both HTML and Markdown.

## Content model

Three kinds of list entry, all Markdown with YAML frontmatter. How a row renders
is decided in `note-row.njk` (redirect → external link, page → internal link,
otherwise plain text):

- **Notes** (`src/notes/*.md`) → rendered as a page at `/<filename>.html`
  (e.g. `about.md` → `/about.html`); the row links to that page.
- **Redirects** (`src/redirects/*.md`) → **no page** (`permalink: false`); the
  row links straight to the external `redirect:` URL (with an `open_in_new` icon).
- **List-only entries** — a note in `src/notes/` with `link: false`: **no page**
  is generated, and the row shows the title as **plain text** (no link).

### Frontmatter fields

| field       | type    | meaning |
|-------------|---------|---------|
| `title`     | string  | display title |
| `date`      | YYYY-MM-DD | sort key + shown as `YYYY-MM` in lists |
| `published` | bool    | must be `true` to appear anywhere |
| `keywords`  | list    | categories; drive keyword pages (case-insensitive) |
| `ongoing`   | bool    | shows **Ongoing** instead of the date, sorts to top |
| `link`      | bool    | `false` = list-only entry: no page, rendered as plain text |
| `redirect`  | URL     | *(redirects only)* external destination |

## How it fits together

- **Collections** (`eleventy.config.js`):
  - `notes` — all published notes + redirects; `ongoing` first, then newest by `date`.
  - `keywordList` — unique, lowercased keywords across all published content.
- **Filters**: `readableDate` (`16 April 2026`), `monthYear` (`2026-04`),
  `notesWithKeyword(notes, kw)` (case-insensitive filter).
- **Homepage** (`index.njk`): lists `keywordList` (links to `/<kw>.html`) and the
  full `notes` Timeline via the `noteRow` macro.
- **Keyword pages** (`keyword.njk`): paginate over `keywordList`, one page each at
  `/<keyword>.html`, listing `notes | notesWithKeyword(keyword)`.
- **Row rendering** is centralized in `note-row.njk` — redirect vs internal link,
  and the `Ongoing`/date label, live there. Change row markup in one place.

## Markdown features

Three small custom markdown-it plugins live in `eleventy.config.js` (raw HTML is
also enabled via `md.set({ html: true })`):

- **Callouts** (`calloutPlugin`) — Obsidian syntax:
  ```markdown
  > [!note] Optional title
  > Body **markdown** here.
  ```
  → `<aside class="callout callout--note">` with a `.callout__title`. The type
  (`note`, `tip`, …) becomes a `callout--<type>` modifier class.

- **Media layouts** (`mediaPlugin`) — fenced `:::name` blocks for image layout:
  ```markdown
  :::columns wide
  ![alt](/resources/a.png "Caption A")

  ![alt](/resources/b.png "Caption B")
  :::
  ```
  → `<div class="media media--columns media--wide">`. Each space-separated name
  becomes a `media--<name>` modifier; content inside is normal Markdown. Variants
  styled in `main.css`: `small` / `medium` (constrained width), `left` / `right`
  (alignment), `columns` (2-up, collapses on mobile), `wide` (breakout past the
  650px column). New variants are just CSS. *In a `columns` block, separate the
  two images with a blank line so they become two grid items.*

- **Captions / figures** (`figurePlugin`) — a standalone image with a title
  becomes `<figure>` + `<figcaption>`:
  ```markdown
  ![alt for screen readers](/resources/x.png "Visible caption")
  ```
  `alt` stays for accessibility; the title is the visible caption.

- **Images & files**: drop the file in `src/resources/`, reference root-relative
  as `/resources/x.png` (images, PDFs, etc.). Content images are centered by
  default; `left`/`right` modifiers override.

## Styling

- `main.css` is the base (imports `variables.css` + `material-symbols.css`);
  `intro.css` is homepage-only (loaded via the `styles` frontmatter list).
- Design tokens live in `variables.css`: paper/ink color scale, Chivo + Chivo Mono
  fonts. Reuse the `--ink*`, `--paper*`, `--rule*` variables.
- Material Symbols (Google Fonts) provides the `open_in_new` / `arrow_forward` icons.

## Gotchas / conventions

- **Permalinks are derived from the filename** via `eleventyComputed` in
  `notes.11tydata.js`, which *overrides* any `permalink:` in a note's frontmatter.
  To change a note's URL, rename the file (or change that data file).
- **Keyword slugs are lowercased**; pages render the title capitalized. Keep
  keyword casing consistent enough that the lowercased form is what you want as URL.
- Some homepage links are **hardcoded** (`/about.html`, `/now.html` in `index.njk`);
  update them if those notes are renamed.
