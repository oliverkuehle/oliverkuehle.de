const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Normalise a keyword for grouping and slugs (case-insensitive). */
const normalize = (k) => String(k).trim().toLowerCase();

// All note-like content: full posts in notes/, link-only entries in redirects/.
const CONTENT_GLOBS = ["src/notes/*.md", "src/redirects/*.md"];

module.exports = function (eleventyConfig) {
  // ---------- Static assets ----------
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/resources");

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
      .sort((a, b) => b.date - a.date)
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
