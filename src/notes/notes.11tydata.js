// Shared data for every note. Each note is output at /<filename>.html,
// matching the links used across the site (about.html, now.html, …).
module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) => `/${data.page.fileSlug}.html`,
  },
};
