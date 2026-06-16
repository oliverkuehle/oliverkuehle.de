const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Normalise a keyword for grouping and slugs (case-insensitive). */
const normalize = (k) => String(k).trim().toLowerCase();

// All note-like content: full posts in notes/, link-only entries in redirects/.
const CONTENT_GLOBS = ["src/notes/*.md", "src/redirects/*.md"];

// Obsidian-style callouts in Markdown:
//   > [!note] Optional title
//   > Body **markdown** here.
// Re-tags the blockquote as <aside class="callout callout--note"> and lifts the
// "[!type] title" line into a <p class="callout__title">, reusing .callout CSS.
function calloutPlugin(md) {
  const TITLE_RE = /^\[!(\w+)\][+-]?\s*(.*)$/;
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  md.core.ruler.after("block", "callouts", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i];
      const pOpen = tokens[i + 1];
      const inline = tokens[i + 2];
      if (
        open.type !== "blockquote_open" ||
        !pOpen || pOpen.type !== "paragraph_open" ||
        !inline || inline.type !== "inline"
      ) continue;

      const content = inline.content;
      const nl = content.indexOf("\n");
      const firstLine = nl === -1 ? content : content.slice(0, nl);
      const match = firstLine.match(TITLE_RE);
      if (!match) continue;

      const type = match[1].toLowerCase();
      const title = match[2].trim() || capitalize(type);
      const body = nl === -1 ? "" : content.slice(nl + 1);

      // Re-tag the surrounding blockquote as the callout container.
      open.tag = "aside";
      open.attrSet("class", `callout callout--${type}`);
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === "blockquote_close" && tokens[j].level === open.level) {
          tokens[j].tag = "aside";
          break;
        }
      }

      // Build the title paragraph; its content is parsed later by the inline rule.
      const tOpen = new state.Token("paragraph_open", "p", 1);
      tOpen.attrSet("class", "callout__title");
      tOpen.block = true;
      const tInline = new state.Token("inline", "", 0);
      tInline.content = title;
      tInline.children = [];
      const tClose = new state.Token("paragraph_close", "p", -1);
      tClose.block = true;

      if (body.trim() === "") {
        // No body: replace the marker-only paragraph with the title.
        tokens.splice(i + 1, 3, tOpen, tInline, tClose);
      } else {
        // Strip the marker line, keep the rest as the body paragraph.
        inline.content = body;
        tokens.splice(i + 1, 0, tOpen, tInline, tClose);
      }
    }
  });
}

// Generic media container for image layouts:
//   :::columns wide
//   ![alt](/resources/a.png "Caption A")
//
//   ![alt](/resources/b.png "Caption B")
//   :::
// Each space-separated name becomes a `media--<name>` modifier on a
// <div class="media …">. Content inside is parsed as normal Markdown.
function mediaPlugin(md) {
  md.block.ruler.before("fence", "media", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    if (state.src.slice(start, start + 3) !== ":::") return false;

    const params = state.src.slice(start + 3, max).trim();
    if (!params) return false; // a bare ::: only closes an open block

    if (silent) return true;

    // Find the closing fence (a line that is just ":::").
    let nextLine = startLine;
    let haveEnd = false;
    while (++nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      if (
        state.src.slice(lineStart, lineStart + 3) === ":::" &&
        !state.src.slice(lineStart + 3, lineMax).trim()
      ) {
        haveEnd = true;
        break;
      }
    }

    const classes = params.split(/\s+/).map((c) => `media--${c}`).join(" ");
    const oldLineMax = state.lineMax;
    state.lineMax = nextLine;

    const open = state.push("media_open", "div", 1);
    open.attrSet("class", `media ${classes}`);
    open.block = true;
    open.map = [startLine, nextLine];

    state.md.block.tokenize(state, startLine + 1, nextLine);

    const close = state.push("media_close", "div", -1);
    close.block = true;

    state.lineMax = oldLineMax;
    state.line = nextLine + (haveEnd ? 1 : 0);
    return true;
  });
}

// Turn a standalone image carrying a title into <figure> + <figcaption>:
//   ![alt for screen readers](/resources/x.png "Visible caption")
// The alt stays for accessibility; the title becomes the visible caption.
function figurePlugin(md) {
  md.core.ruler.after("inline", "figures", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i + 2 < tokens.length; i++) {
      if (
        tokens[i].type !== "paragraph_open" ||
        tokens[i + 1].type !== "inline" ||
        tokens[i + 2].type !== "paragraph_close"
      ) continue;

      const children = tokens[i + 1].children || [];
      const meaningful = children.filter(
        (t) => t.type !== "softbreak" && !(t.type === "text" && !t.content.trim())
      );
      if (meaningful.length !== 1 || meaningful[0].type !== "image") continue;

      const image = meaningful[0];
      const caption = image.attrGet("title");
      if (!caption) continue;

      // Drop the title so it isn't also a hover tooltip.
      image.attrs = image.attrs.filter((a) => a[0] !== "title");

      // Re-tag the wrapping paragraph as a <figure>.
      tokens[i].tag = "figure";
      tokens[i + 2].tag = "figure";

      // Build the <figcaption>, parsing the caption as inline Markdown.
      const capOpen = new state.Token("figcaption_open", "figcaption", 1);
      capOpen.block = true;
      const capInline = new state.Token("inline", "", 0);
      capInline.content = caption;
      capInline.children = [];
      state.md.inline.parse(caption, state.md, state.env, capInline.children);
      const capClose = new state.Token("figcaption_close", "figcaption", -1);
      capClose.block = true;

      tokens.splice(i + 2, 0, capOpen, capInline, capClose);
    }
  });
}

module.exports = function (eleventyConfig) {
  // ---------- Static assets ----------
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/resources");

  // ---------- Markdown ----------
  // Allow raw HTML, and enable Obsidian-style callouts (see calloutPlugin).
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ html: true });
    md.use(calloutPlugin);
    md.use(mediaPlugin);
    md.use(figurePlugin);
  });

  // ---------- Date filters ----------
  // Dates are authored as plain YYYY-MM-DD, parsed by Eleventy as UTC midnight,
  // so format with UTC getters to avoid timezone-induced off-by-one days.
  eleventyConfig.addFilter("readableDate", (date) => {
    const d = new Date(date);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });

  eleventyConfig.addFilter("monthYear", (date) => {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });

  // ---------- Collections ----------
  // All published notes, newest first.
  eleventyConfig.addCollection("notes", (api) =>
    api
      .getFilteredByGlob(CONTENT_GLOBS)
      .filter((item) => item.data.published)
      // "ongoing" notes (ongoing work) float to the top, then newest first.
      .sort((a, b) => (b.data.ongoing ? 1 : 0) - (a.data.ongoing ? 1 : 0) || b.date - a.date)
  );

  // Unique, normalised list of keywords across all published notes.
  eleventyConfig.addCollection("keywordList", (api) => {
    const set = new Set();
    api
      .getFilteredByGlob(CONTENT_GLOBS)
      .filter((item) => item.data.published)
      .forEach((item) =>
        (item.data.keywords || []).forEach((k) => set.add(normalize(k)))
      );
    return [...set].sort();
  });

  // ---------- Filters ----------
  // Notes carrying a given keyword (case-insensitive), preserving sort order.
  eleventyConfig.addFilter("notesWithKeyword", (notes, keyword) => {
    const target = normalize(keyword);
    return notes.filter((n) =>
      (n.data.keywords || []).map(normalize).includes(target)
    );
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
