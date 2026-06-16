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
eleventy.config.js     # all config: collections, filters, markdown plugin
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

Two kinds of content, both Markdown with YAML frontmatter:

- **Notes** (`src/notes/*.md`) → rendered as a page at `/<filename>.html`
  (e.g. `about.md` → `/about.html`). Filename is the URL; see gotchas.
- **Redirects** (`src/redirects/*.md`) → **no page** (`permalink: false`). They
  still appear in lists, but the list entry links straight to the external
  `redirect:` URL (with an `open_in_new` icon).

### Frontmatter fields

| field       | type    | meaning |
|-------------|---------|---------|
| `title`     | string  | display title |
| `date`      | YYYY-MM-DD | sort key + shown as `YYYY-MM` in lists |
| `published` | bool    | must be `true` to appear anywhere |
| `keywords`  | list    | categories; drive keyword pages (case-insensitive) |
| `ongoing`   | bool    | shows **Ongoing** instead of the date, sorts to top |
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

- Raw HTML is enabled (`md.set({ html: true })`).
- **Obsidian-style callouts** via a small custom markdown-it plugin (`calloutPlugin`):
  ```markdown
  > [!note] Optional title
  > Body **markdown** here.
  ```
  becomes `<aside class="callout callout--note">` with a `.callout__title`. The
  type (`note`, `tip`, …) becomes a `callout--<type>` modifier class for styling.
- **Images**: put the file in `src/resources/`, reference as `/resources/x.png`
  (Markdown `![alt](/resources/x.png)` or raw `<img>`).

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
