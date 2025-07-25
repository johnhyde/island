/**
 * Main application script for the Flying Island novel site
 */
class NovelSite {
  constructor() {
    this.currentParser = null; // Current parser instance for active chapter
    this.chapters = [];
    this.currentChapter = null;
    this.chapterCache = new Map(); // Cache for chapter content and parser instances
    this.spacedEmDashes = this.loadEmDashPreference();
    this.darkMode = this.loadDarkModePreference();
    this.showAnnotations = this.loadAnnotationPreference();

    this.init();
  }

  async init() {
    await this.loadChapterList();
    this.renderTableOfContents();
    this.setupEventListeners();
    this.setupEmDashToggle();
    this.setupDarkModeToggle();
    this.setupAnnotationsToggle();

    // Apply initial dark mode state
    this.updateDarkModeStyle();

    // Load chapter based on URL or default to first
    this.handleURLChange();
  }

  async loadChapterList() {
    try {
      // Load chapters from generated JSON file
      const response = await fetch("site/chapters.json");
      if (!response.ok) {
        throw new Error("Failed to load chapters.json");
      }

      const data = await response.json();

      // Trust the chapters.json file and add all chapters
      for (const chapter of data.chapters) {
        this.chapters.push({
          filename: chapter.filename,
          title: this.capitalizeTitle(chapter.title),
        });
      }
    } catch (error) {
      console.error("Error loading chapter list:", error);
      // Fallback to empty list
      this.chapters = [];
    }
  }

  capitalizeTitle(title) {
    return title.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  generateChapterSlug(filename) {
    // Convert filename to URL-friendly slug
    // "01 prologue.md" -> "prologue"
    // "02 one fine day.md" -> "one-fine-day"
    const basename = filename.replace(/\.md$/, "");
    const titlePart = basename.replace(/^[0-9][0-9]\s*/, "");
    return titlePart.toLowerCase().replace(/\s+/g, "-").replace(
      /[^a-z0-9-]/g,
      "",
    );
  }

  updateURL(filename, title) {
    const slug = this.generateChapterSlug(filename);
    const url = `#${slug}`;

    // Only pushState if the URL is actually changing
    if (window.location.hash !== url) {
      history.pushState({ filename, title }, title, url);
    }
    document.title = `${title} - Flying Island`;
  }

  handleURLChange() {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash) {
      // Find chapter by slug
      const chapter = this.chapters.find((ch) =>
        this.generateChapterSlug(ch.filename) === hash
      );
      if (chapter) {
        this.loadChapter(chapter.filename, false); // false = don't update URL
      }
    } else if (this.chapters.length > 0) {
      // Default to first chapter if no hash
      this.loadChapter(this.chapters[0].filename, true);
    }
  }

  renderTableOfContents() {
    const chapterList = document.getElementById("chapter-list");
    chapterList.innerHTML = "";

    for (const chapter of this.chapters) {
      const li = document.createElement("li");
      const a = document.createElement("a");

      // Set proper href with chapter slug
      const slug = this.generateChapterSlug(chapter.filename);
      a.href = `#${slug}`;
      a.textContent = chapter.title;
      a.dataset.filename = chapter.filename;

      a.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.loadChapter(chapter.filename, true);
      });

      li.appendChild(a);
      chapterList.appendChild(li);
    }
  }

  async loadChapter(filename, updateUrl = true) {
    try {
      // Check cache first
      const cached = this.getCachedChapter(filename);
      let title, parser, html;

      if (cached) {
        // Use cached parser instance and HTML
        parser = cached.parser;
        html = cached.html;
        title = cached.title;
      } else {
        // Fetch and parse new content
        const response = await fetch(filename);
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}`);
        }

        const markdown = await response.text();
        parser = new MarkdownParser();
        const result = parser.parse(markdown);
        html = result.html;
        title = this.getChapterTitle(filename);

        // Cache the parser instance and data
        this.cacheChapter(filename, {
          markdown: markdown,
          parser: parser,
          html: html,
          title: title,
        });
      }

      // Set current parser
      this.currentParser = parser;
      this.currentChapter = filename;

      // Update the main content
      document.getElementById("chapter-title").textContent = title;
      document.getElementById("chapter-text").innerHTML = html;

      // Apply em-dash styling to the content
      this.updateEmDashStyle();

      // Update footnotes and apply em-dash styling
      document.getElementById("footnotes-content").innerHTML = this
        .currentParser
        .formatFootnotes();
      const footnotesContent = document.getElementById("footnotes-content");
      if (footnotesContent) {
        this.updateElementEmDashes(footnotesContent);
      }

      // Setup footnote click handlers
      this.setupFootnoteHandlers();

      // Setup annotation visibility and click handlers
      this.updateAnnotationVisibility();

      // Update URL and browser history
      if (updateUrl) {
        this.updateURL(filename, title);
      }

      // Update active state in table of contents
      this.updateActiveChapter(filename);
    } catch (error) {
      console.error("Error loading chapter:", error);
      document.getElementById("chapter-title").textContent =
        "Error Loading Chapter";
      document.getElementById("chapter-text").innerHTML = `
                <p>Sorry, there was an error loading the chapter "${filename}". Please try again.</p>
            `;
      document.getElementById("footnotes-content").innerHTML =
        '<p class="footnotes-placeholder">No footnotes available.</p>';
    }
  }

  getChapterTitle(filename) {
    const chapter = this.chapters.find((c) => c.filename === filename);
    return chapter
      ? chapter.title
      : filename.replace(".md", "").replace(/^\d+\s*/, "");
  }

  getCachedChapter(filename) {
    return this.chapterCache.get(filename);
  }

  cacheChapter(filename, data) {
    this.chapterCache.set(filename, {
      markdown: data.markdown,
      parser: data.parser,
      html: data.html,
      title: data.title,
      timestamp: Date.now(),
    });
  }

  updateActiveChapter(filename) {
    // Remove active class from all links
    document.querySelectorAll(".table-of-contents a").forEach((link) => {
      link.classList.remove("active");
    });

    // Add active class to the current chapter link
    const activeLink = document.querySelector(
      `.table-of-contents a[data-filename="${filename}"]`,
    );
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  setupFootnoteHandlers() {
    // Add click handlers to footnote references
    document.querySelectorAll(".footnote-ref").forEach(
      this.setupFootnoteHandler.bind(this),
    );
    document.querySelectorAll(".annotation-ref").forEach(
      this.setupAnnotationHandler.bind(this),
    );
  }
  setupFootnoteHandler(ref) {
    ref.addEventListener("click", (e) => {
      e.preventDefault();
      const footnoteLabel = ref.dataset.id;
      this.handleFootnoteClick(footnoteLabel);
    });
  }
  isNarrowScreen() {
    return window.innerWidth <= 900;
  }

  handleFootnoteClick(label) {
    if (this.isNarrowScreen()) {
      this.showPopup(label);
    } else {
      this.highlightFootnote(label);
    }
  }

  highlightFootnote(label) {
    this.hidePopup();
    // Remove previous highlights
    document.querySelectorAll(".footnote.highlighted").forEach((fn) => {
      fn.classList.remove("highlighted");
    });

    // Find and highlight the target footnote
    const targetFootnote = document.querySelector(
      `.footnote[data-id="${label}"]`,
    );
    if (targetFootnote) {
      targetFootnote.classList.add("highlighted");

      // Scroll footnote into view
      targetFootnote.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Remove highlight after a few seconds
      setTimeout(() => {
        targetFootnote.classList.remove("highlighted");
      }, 3000);
    }
  }

  setupEventListeners() {
    // Handle browser back/forward buttons
    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.filename) {
        // Load chapter from browser history state
        this.loadChapter(event.state.filename, false);
      } else {
        // Handle URL hash change
        this.handleURLChange();
      }
    });

    // Handle direct URL hash changes (e.g., typing in address bar)
    window.addEventListener("hashchange", () => {
      this.handleURLChange();
    });

    // Setup footnote popup event listeners
    this.setupPopupEventListeners();
  }

  setupPopupEventListeners() {
    const popup = document.getElementById("footnote-popup");
    const closeBtn = document.querySelector(".footnote-popup-close");
    const backdrop = document.querySelector(".footnote-popup-backdrop");

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.hidePopup();
      });
    }

    // Backdrop click
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.hidePopup();
      });
    }

    // ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup && popup.classList.contains("show")) {
        this.hidePopup();
      }
    });
  }

  showPopup(label) {
    // Find the footnote content from parser's footnoteOrder
    const footnote = this.currentParser.footnoteOrder.find((fn) =>
      fn.label === label
    );
    const isAnno = this.currentParser.annotations.has(label);
    const title = isAnno ? "Annotation" : "Footnote";
    if (!footnote) {
      console.warn(title + " not found:", label);
      return;
    }

    const popup = document.getElementById("footnote-popup");
    const body = document.getElementById("footnote-popup-body");

    if (!popup || !body) {
      console.error("Popup elements not found");
      return;
    }
    const titleEl = document.getElementById("modal-title");
    titleEl.innerHTML = title;

    // Create footnote content with proper formatting
    const processedContent = this.currentParser.processInlineElements(
      footnote.content,
    );
    const styledContent = this.applyEmDashStyle(processedContent);

    const footnoteHtml = isAnno
      ? `<div class="annotation-content">${processedContent}</div>`
      : `
            <div class="footnote-content">
                <span class="footnote-label">${footnote.number}:</span>
                ${styledContent}
            </div>
        `;

    body.innerHTML = footnoteHtml;

    // Setup nested footnote handlers within the popup
    this.setupPopupFootnoteHandlers();
    this.updateAnnotationVisibility();

    // Show popup with animation
    popup.classList.add("show");

    // Focus management for accessibility
    const closeBtn = popup.querySelector(".footnote-popup-close");
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  hidePopup() {
    const popup = document.getElementById("footnote-popup");
    if (popup) {
      popup.classList.remove("show");
    }
  }

  setupPopupFootnoteHandlers() {
    // Handle footnote references within the popup
    const popupBody = document.getElementById("footnote-popup-body");
    if (!popupBody) return;

    popupBody.querySelectorAll(".footnote-ref").forEach(
      this.setupFootnoteHandler.bind(this),
    );
    popupBody.querySelectorAll(".annotation-ref").forEach(
      this.setupAnnotationHandler.bind(this),
    );
  }

  loadEmDashPreference() {
    // Load preference from localStorage, default to unspaced (J's style)
    const saved = localStorage.getItem("emDashStyle");
    return saved === null ? false : saved === "spaced";
  }

  saveEmDashPreference(spaced) {
    localStorage.setItem("emDashStyle", spaced ? "spaced" : "unspaced");
  }

  setupEmDashToggle() {
    const toggle = document.getElementById("emdash-toggle");
    if (!toggle) {
      console.warn("Em-dash toggle element not found");
      return;
    }

    console.log(
      "Setting up em-dash toggle, initial state:",
      this.spacedEmDashes,
    );

    // Set initial state
    toggle.checked = this.spacedEmDashes;

    // Handle toggle changes
    toggle.addEventListener("change", (e) => {
      console.log("Toggle changed to:", e.target.checked);
      this.spacedEmDashes = e.target.checked;
      this.saveEmDashPreference(this.spacedEmDashes);
      this.updateEmDashStyle();
    });
  }

  normalizeEmDashes(text) {
    // First normalize all em-dashes to a consistent format
    // Handle both spaced and unspaced variants
    return text.replace(/(\s*)—(\s*)/g, "—");
  }

  applyEmDashStyle(text) {
    // Normalize first, then apply the user's preferred style
    const normalized = this.normalizeEmDashes(text);

    if (this.spacedEmDashes) {
      // Convert to spaced em-dashes (M's style)
      return normalized.replace(/—/g, " — ");
    } else {
      // Keep unspaced em-dashes (J's style)
      return normalized;
    }
  }

  updateEmDashStyle() {
    console.log(
      "Updating em-dash style to:",
      this.spacedEmDashes ? "spaced" : "unspaced",
    );

    // Update the current chapter's content with the new em-dash style
    const chapterText = document.getElementById("chapter-text");
    if (chapterText) {
      console.log("Found chapter text element, updating...");
      // Get all text content and update em-dashes
      this.updateElementEmDashes(chapterText);
    } else {
      console.log("Chapter text element not found");
    }

    // Also update footnotes sidebar content
    const footnotesContent = document.getElementById("footnotes-content");
    if (footnotesContent) {
      console.log("Found footnotes content element, updating...");
      this.updateElementEmDashes(footnotesContent);
    } else {
      console.log("Footnotes content element not found");
    }
  }

  updateElementEmDashes(element) {
    // Recursively update em-dashes in text nodes
    if (element.nodeType === Node.TEXT_NODE) {
      element.textContent = this.applyEmDashStyle(element.textContent);
    } else {
      for (let child of element.childNodes) {
        this.updateElementEmDashes(child);
      }
    }
  }

  loadDarkModePreference() {
    // Load preference from localStorage, default to light mode
    const saved = localStorage.getItem("darkModeStyle");
    return saved === null ? false : saved === "dark";
  }

  saveDarkModePreference(dark) {
    localStorage.setItem("darkModeStyle", dark ? "dark" : "light");
  }

  setupDarkModeToggle() {
    const toggle = document.getElementById("darkmode-toggle");
    if (!toggle) {
      console.warn("Dark mode toggle element not found");
      return;
    }

    console.log("Setting up dark mode toggle, initial state:", this.darkMode);

    // Set initial state
    toggle.checked = this.darkMode;

    // Handle toggle changes
    toggle.addEventListener("change", (e) => {
      console.log("Dark mode toggle changed to:", e.target.checked);
      this.darkMode = e.target.checked;
      this.saveDarkModePreference(this.darkMode);
      this.updateDarkModeStyle();
    });
  }

  updateDarkModeStyle() {
    console.log("Updating dark mode to:", this.darkMode ? "dark" : "light");

    if (this.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  loadAnnotationPreference() {
    // Load preference from localStorage, default to hidden
    const saved = localStorage.getItem("annotationStyle");
    return saved === null ? false : saved === "show";
  }

  saveAnnotationPreference(show) {
    localStorage.setItem("annotationStyle", show ? "show" : "hide");
  }

  setupAnnotationsToggle() {
    const toggle = document.getElementById("annotations-toggle");
    if (!toggle) {
      console.warn("Annotations toggle element not found");
      return;
    }

    console.log(
      "Setting up annotations toggle, initial state:",
      this.showAnnotations,
    );

    // Set initial state
    toggle.checked = this.showAnnotations;

    // Handle toggle changes
    toggle.addEventListener("change", (e) => {
      console.log("Annotations toggle changed to:", e.target.checked);
      this.showAnnotations = e.target.checked;
      this.saveAnnotationPreference(this.showAnnotations);
      this.updateAnnotationVisibility();
    });
  }

  updateAnnotationVisibility() {
    console.log(
      "Updating annotation visibility to:",
      this.showAnnotations ? "show" : "hide",
    );

    document.querySelectorAll(".annotation-ref").forEach((annotation) => {
      if (this.showAnnotations) {
        annotation.classList.add("visible");
      } else {
        annotation.classList.remove("visible");
      }
    });
  }

  setupAnnotationHandler(annotation) {
    annotation.addEventListener("click", (e) => {
      e.preventDefault();
      const annotationId = annotation.dataset.id;
      this.showPopup(annotationId);
    });
  }
}

// Initialize the site when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new NovelSite();
});
