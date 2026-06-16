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

module.exports = function (eleventyConfig) {
  // ---------- Static assets ----------
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/resources");

  // ---------- Markdown ----------
  // Allow raw HTML, and enable Obsidian-style callouts (see calloutPlugin).
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ html: true });
    md.use(calloutPlugin);
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
