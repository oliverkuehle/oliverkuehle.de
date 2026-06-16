// Shared data for every note. Each note is output at /<filename>.html,
// matching the links used across the site (about.html, now.html, …).
// A note with `link: false` is a list-only entry: no page is generated, and the
// row macro renders its title as plain text.
module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) =>
      data.link === false ? false : `/${data.page.fileSlug}.html`,
  },
};
