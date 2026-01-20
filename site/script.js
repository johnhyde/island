/**
 * Main application script for the Flying Island novel site
 */
class NovelSite {
  constructor() {
    this.currentParser = null; // Current parser instance for active chapter
    this.chapters = [];
    this.currentChapter = null;
    this.chapterCache = new Map(); // Cache for chapter content and parser instances
    this.prefs = new PreferenceManager();
    this.spacedEmDashes = this.prefs.get("spacedEmDashes", false);
    this.darkMode = this.prefs.get("darkMode", false);
    this.showAnnotations = this.prefs.get("showAnnotations", false);

    this.init();
  }

  async init() {
    await this.loadChapterList();
    this.renderTableOfContents();
    this.setupEventListeners();
    this.setupToggle(
      "emdash-toggle",
      "spacedEmDashes",
      "spacedEmDashes",
      "updateEmDashStyle",
    );
    this.setupToggle(
      "darkmode-toggle",
      "darkMode",
      "darkMode",
      "updateDarkModeStyle",
    );
    this.setupToggle(
      "annotations-toggle",
      "showAnnotations",
      "showAnnotations",
      "updateAnnotationVisibility",
    );

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
    title = title.replace(/(^|[-\s])\W*\w/g, (char) => char.toUpperCase());
    return title.replace(
      /(?<!^)(To|By|In|The|A)\b/g,
      (str) => str.toLowerCase(),
    );
  }

  getChapterNumber(filename) {
    if (!filename) return null;
    const match = filename.match(/([A-Z]*)(\d+)/);
    return match ? match[1] + parseInt(match[2], 10) : null;
  }

  generateChapterSlug(filename) {
    if (!filename) return "";
    // filename example
    // "./02 one fine day.jd"
    const basename = filename.replace(/\.jd$/, "");
    return basename.toLowerCase().replace(/\s+/g, "-").replace(
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
      this.unloadChapter();
      // this.loadChapter(this.chapters[0].filename, true);
    }
  }

  renderTableOfContents() {
    const chapterList = document.getElementById("chapter-list");
    chapterList.innerHTML = "";
    const appendixList = document.getElementById("appendix-list");
    appendixList.innerHTML = "";

    for (const chapter of this.chapters) {
      const li = document.createElement("li");
      const a = document.createElement("a");

      // Set proper href with chapter slug
      const slug = this.generateChapterSlug(chapter.filename);
      a.href = `#${slug}`;

      // Extract chapter number from filename (e.g., "01" from "./01 prologue.jd")
      const chapterNumber = this.getChapterNumber(chapter.filename);
      a.textContent = chapterNumber
        ? `${chapterNumber}. ${chapter.title}`
        : chapter.title;
      a.dataset.filename = chapter.filename;
      a.dataset.slug = slug;

      a.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.loadChapter(chapter.filename, true);
      });

      li.appendChild(a);
      if (chapterNumber.startsWith("A")) {
        appendixList.appendChild(li);
      } else {
        chapterList.appendChild(li);
      }
    }
  }

  async loadChapter(filename, updateUrl = true) {
    try {
      // Check cache first
      const cached = this.getCachedChapter(filename);
      let title, parser, html, markerInfo;

      if (cached) {
        // Use cached parser instance, HTML, and raw content
        parser = cached.parser;
        html = cached.html;
        title = cached.title;
        // raw content stored in cache for word counting
        const raw = cached.content || "";
        // Pass annotation labels from the parser if available so we can exclude them
        const annotations = parser && parser.annotations
          ? parser.annotations
          : null;
        markerInfo = this.computeWordsSinceLastMarker(raw, annotations);
      } else {
        // Fetch and parse new content
        const response = await fetch(filename);
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}`);
        }

        const johndown = await response.text();
        parser = new JohndownParser();
        const result = parser.parse(johndown);
        html = result.html;
        title = this.getChapterTitle(filename);

        // Cache the parser instance and data
        this.cacheChapter(filename, {
          parser: parser,
          html: html,
          title: title,
          content: johndown,
        });

        // Pass parser.annotations so annotation content is excluded from the count
        markerInfo = this.computeWordsSinceLastMarker(
          johndown,
          parser.annotations,
        );
      }

      // Set current parser and chapter
      this.currentParser = parser;
      this.currentChapter = filename;

      // Update page content and UI (pass marker info for rendering)
      const words = markerInfo ? markerInfo.count : null;
      const markerText = markerInfo ? markerInfo.marker : null;
      this.updatePageContent(
        title,
        html,
        updateUrl,
        filename,
        words,
        markerText,
      );
    } catch (error) {
      console.error("Error loading chapter:", error);
      this.showError(
        `Sorry, there was an error loading the chapter "${filename}". Please try again.`,
      );
    }
  }

  unloadChapter(updateUrl = true) {
    this.currentParser = null;
    this.currentChapter = null;
    this.updatePageContent(
      "Select a chapter to begin reading",
      `<p>Choose a chapter from the table of contents to read.</p>`,
      updateUrl,
      null,
      null,
    );
    this.updateFootnotesContent(
      "Footnotes will appear here when you select a chapter.",
    );
  }

  updatePageContent(
    title,
    html,
    updateUrl,
    filename,
    wordCount = null,
    markerText = null,
  ) {
    // Update the main content
    document.getElementById("chapter-title").textContent = title;
    document.getElementById("chapter-text").innerHTML = html;

    // Apply em-dash styling to the content
    this.updateEmDashStyle();

    // Update footnotes and apply em-dash styling
    if (this.currentParser) {
      this.updateFootnotesContent(this.currentParser.formatFootnotes());
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
    this.updateActiveChapter(this.generateChapterSlug(filename));

    // Load Utterances comments for the chapter
    if (filename) {
      this.loadUtterances(title);
    } else {
      this.cleanupUtterances();
    }

    // Render the 'words since last marker' note at the end of the page
    const chapterTextEl = document.getElementById("chapter-text");
    if (chapterTextEl) {
      const existing = chapterTextEl.querySelector(".words-since-marker");
      if (existing) existing.remove();
      if (wordCount !== null && wordCount !== undefined) {
        const note = document.createElement("div");
        note.className = "words-since-marker";
        const label = markerText || "[marker]";
        note.textContent = `🤖︎ < ${wordCount} words since last ${label}`;
        chapterTextEl.appendChild(note);
      }
    }
  }

  updateFootnotesContent(text) {
    // Update footnotes and apply em-dash styling
    const footnotesContent = document.getElementById("footnotes-content");
    if (footnotesContent) {
      footnotesContent.innerHTML = text;
      this.updateElementEmDashes(footnotesContent);
    }
  }

  showError(message) {
    document.getElementById("chapter-title").textContent =
      "Error Loading Chapter";
    document.getElementById("chapter-text").innerHTML = `<p>${message}</p>`;
    document.getElementById("footnotes-content").innerHTML =
      '<p class="footnotes-placeholder">No footnotes available.</p>';
  }

  getChapterTitle(filename) {
    const chapter = this.chapters.find((c) => c.filename === filename);
    return chapter
      ? chapter.title
      : filename.replace(".jd", "").replace(/^\d+\s*/, "");
  }

  getCachedChapter(filename) {
    return this.chapterCache.get(filename);
  }

  cacheChapter(filename, data) {
    this.chapterCache.set(filename, {
      parser: data.parser,
      html: data.html,
      title: data.title,
      content: data.content || null,
      timestamp: Date.now(),
    });
  }

  computeWordsSinceLastMarker(johndown, annotationsSet = null) {
    if (!johndown || typeof johndown !== "string") return null;

    // Work on a copy and remove annotation inline constructs [@ ...] using bracket matching
    let text = johndown;

    // Remove inline annotation blocks starting with '[@'
    const removeInlineAnnotations = (src) => {
      let out = "";
      let i = 0;
      while (i < src.length) {
        if (src[i] === "[" && src[i + 1] === "@") {
          // consume until matching closing bracket, respecting nested brackets
          let depth = 0;
          let j = i;
          while (j < src.length) {
            if (src[j] === "[") depth++;
            else if (src[j] === "]") {
              depth--;
              if (depth === 0) {
                j++; // move past closing bracket
                break;
              }
            }
            j++;
          }
          i = j; // skip the annotation content entirely
        } else {
          out += src[i];
          i++;
        }
      }
      return out;
    };

    text = removeInlineAnnotations(text);

    // If parser provided annotation labels, strip their inline references and definitions
    if (annotationsSet) {
      // Normalize to a Set of strings (labels likely include leading '^')
      const labels = new Set();
      for (const l of annotationsSet) {
        labels.add(l);
      }

      // Remove footnote definition blocks whose labels are in annotationsSet
      const lines = text.split(/\r?\n/);
      const filtered = [];
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*\[(\^[^\]]+)\]:\s*(.*)$/);
        if (m && labels.has(m[1])) {
          // skip this line and any following indented continuation lines
          i++;
          while (i < lines.length && lines[i].match(/^\s+/)) i++;
          i--; // adjust for the outer loop increment
          continue;
        }
        filtered.push(lines[i]);
      }
      text = filtered.join("\n");

      // Remove inline references like [^LABEL]
      // Doing this after the thing above to avoid unlabeling annotation content definitions before we can remove them
      for (const label of labels) {
        // Escape label for regex
        const esc = label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const refRe = new RegExp(`\\[${esc}\\]`, "g");
        text = text.replace(refRe, "");
      }
    }

    // Find markers like [X; whatever] where X is one or more letters
    const markerRegex = /\[[A-Za-z]+;[^\]]*\]/g;
    let match;
    let lastMatch = null;
    while ((match = markerRegex.exec(text)) !== null) {
      lastMatch = { text: match[0], index: match.index };
    }

    if (!lastMatch) return null;

    const after = text.slice(lastMatch.index + lastMatch.text.length);

    // Count words in the remaining text. Consider sequences of letters/numbers/apostrophes as words.
    const tokens = after.match(/[A-Za-z0-9'’]+/g);
    const count = tokens ? tokens.length : 0;

    return {
      count: count,
      marker: lastMatch.text,
    };
  }

  updateActiveChapter(slug) {
    // Remove active class from all links
    document.querySelectorAll(".table-of-contents a").forEach((link) => {
      link.classList.remove("active");
    });

    // Add active class to the current chapter link
    const activeLink = document.querySelector(
      `.table-of-contents a[data-slug="${slug}"]`,
    );
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  cleanupUtterances() {
    const container = document.getElementById("utterances-comments");
    if (container) {
      container.innerHTML = ""; // Remove existing iframe
    }
  }

  loadUtterances(title) {
    this.cleanupUtterances();

    const container = document.getElementById("utterances-comments");
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.setAttribute("repo", "johnhyde/island");
    script.setAttribute("issue-term", title);
    script.setAttribute("label", "comments section");
    script.setAttribute(
      "theme",
      this.darkMode ? "github-dark" : "github-light",
    );
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    container.appendChild(script);
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

  normalizeEmDashes(text) {
    // First normalize all em-dashes to a consistent format
    // Handle both spaced and unspaced variants
    // return text;
    return text.replace(/( *)—( *)/g, "—");
  }

  applyEmDashStyle(text) {
    // Normalize first, then apply the user's preferred style
    const normalized = this.normalizeEmDashes(text);

    if (this.spacedEmDashes) {
      // Convert to spaced em-dashes (M's style)
      // return normalized;
      return normalized.replace(/—/g, " — ");
    } else {
      // Keep unspaced em-dashes (J's style)
      return normalized;
    }
  }

  updateEmDashStyle() {
    // Update the current chapter's content with the new em-dash style
    const chapterText = document.getElementById("chapter-text");
    if (chapterText) {
      // Get all text content and update em-dashes
      this.updateElementEmDashes(chapterText);
    } else {
    }

    // Also update footnotes sidebar content
    const footnotesContent = document.getElementById("footnotes-content");
    if (footnotesContent) {
      this.updateElementEmDashes(footnotesContent);
    } else {
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

  updateDarkModeStyle() {
    if (this.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    // Reload Utterances with the new theme if a chapter is loaded
    if (this.currentChapter) {
      const title = this.getChapterTitle(this.currentChapter);
      this.loadUtterances(title);
    }
  }

  updateAnnotationVisibility() {
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

  // Generic toggle setup method
  setupToggle(toggleId, property, prefsKey, updateMethod) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) {
      console.warn(`${toggleId} element not found`);
      return;
    }

    // Set initial state
    toggle.checked = this[property];

    // Handle toggle changes
    toggle.addEventListener("change", (e) => {
      this[property] = e.target.checked;
      this.prefs.set(prefsKey, this[property]);
      this[updateMethod]();
    });
  }
}

// Initialize the site when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new NovelSite();
});
