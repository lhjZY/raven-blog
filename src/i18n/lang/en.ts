import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Home",
    posts: "Posts",
    tags: "Tags",
    about: "About",
    archives: "Archives",
    search: "Search",
  },
  post: {
    publishedAt: "Published at",
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "Tags",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Previous Post",
    nextPost: "Next Post",
    copyCode: "Copy",
    copiedCode: "Copied",
    zoomImage: "Zoom image",
    imagePreview: "Image preview",
    closeImagePreview: "Close image preview",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
    pageLabel: "page {{page}}",
  },
  home: {
    greeting: "",
    description:
      "Hello, I'm Leo, a software engineer. Coming up with brilliant ideas and turning them into reality is my passion. I'm eager to build tools that help myself and others improve efficiency and enjoy the creative process.",
    docsBefore: "",
    docsAfter: "",
    socialLinks: "Social Links",
    projects: "Projects",
    projectsDescription:
      "Small tools I build for my own reading, writing and daily work.",
    recentPosts: "Recent Posts",
    allPosts: "All Posts",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  search: {
    clear_search: "Clear",
    load_more: "Load more results",
    search_label: "Search this site",
    many_results: "[COUNT] results for [SEARCH_TERM]",
    one_result: "[COUNT] result for [SEARCH_TERM]",
    searching: "Searching for [SEARCH_TERM]...",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: 'All the articles with the tag "{{tag}}".',

    tagsTitle: "Tags",
    tagsDesc: "All the tags used in posts.",

    postsTitle: "Posts",
    postsDesc: "All the articles I've posted.",

    archivesTitle: "Archives",
    archivesDesc: "All the articles I've archived.",

    searchTitle: "Search",
    searchDesc: "Search any article ...",
    searchDevWarning: "DEV mode Warning!",
    searchDevDescription:
      "You need to build the project at least once to see the search results during development.",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    lightTheme: "Switch to light mode",
    darkTheme: "Switch to dark mode",
    switchLanguage: "Switch to Chinese",
    rssFeed: "RSS Feed",
    breadcrumb: "Breadcrumb",
    pagination: "Pagination navigation",
    socialProfile: "{{site}} on {{platform}}",
    emailLink: "Send an email to {{site}}",
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page Not Found",
    goHome: "Go back home",
  },
} satisfies UIStrings;
