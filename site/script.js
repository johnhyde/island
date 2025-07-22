/**
 * Main application script for the Flying Island novel site
 */
class NovelSite {
    constructor() {
        this.parser = new MarkdownParser();
        this.chapters = [];
        this.currentChapter = null;
        this.spacedEmDashes = this.loadEmDashPreference();
        
        this.init();
    }

    async init() {
        await this.loadChapterList();
        this.renderTableOfContents();
        this.setupEventListeners();
        this.setupEmDashToggle();
        
        // Load chapter based on URL or default to first
        this.handleURLChange();
    }

    async loadChapterList() {
        try {
            // Load chapters from generated JSON file
            const response = await fetch('site/chapters.json');
            if (!response.ok) {
                throw new Error('Failed to load chapters.json');
            }
            
            const data = await response.json();
            
            // Verify each file actually exists and has content
            for (const chapter of data.chapters) {
                try {
                    const fileResponse = await fetch(chapter.filename);
                    if (fileResponse.ok) {
                        const content = await fileResponse.text();
                        if (content.trim()) { // Only add if file has content
                            this.chapters.push({
                                filename: chapter.filename,
                                title: this.capitalizeTitle(chapter.title)
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Chapter file ${chapter.filename} not accessible:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading chapter list:', error);
            // Fallback to empty list
            this.chapters = [];
        }
    }

    capitalizeTitle(title) {
        return title.replace(/\b\w/g, char => char.toUpperCase());
    }

    generateChapterSlug(filename) {
        // Convert filename to URL-friendly slug
        // "01 prologue.md" -> "prologue"
        // "02 one fine day.md" -> "one-fine-day"
        const basename = filename.replace(/\.md$/, '');
        const titlePart = basename.replace(/^[0-9][0-9]\s*/, '');
        return titlePart.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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
            const chapter = this.chapters.find(ch => 
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
        const chapterList = document.getElementById('chapter-list');
        chapterList.innerHTML = '';

        for (const chapter of this.chapters) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            // Set proper href with chapter slug
            const slug = this.generateChapterSlug(chapter.filename);
            a.href = `#${slug}`;
            a.textContent = chapter.title;
            a.dataset.filename = chapter.filename;
            
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.loadChapter(chapter.filename, true);
            });
            
            li.appendChild(a);
            chapterList.appendChild(li);
        }
    }

    async loadChapter(filename, updateUrl = true) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}`);
            }
            
            const markdown = await response.text();
            this.currentChapter = filename;
            
            // Parse the markdown
            const result = this.parser.parse(markdown);
            
            // Update the main content
            const title = this.getChapterTitle(filename);
            document.getElementById('chapter-title').textContent = title;
            document.getElementById('chapter-text').innerHTML = result.html;
            
            // Apply em-dash styling to the content
            this.updateEmDashStyle();
            
            // Update footnotes and apply em-dash styling
            document.getElementById('footnotes-content').innerHTML = this.parser.formatFootnotes();
            const footnotesContent = document.getElementById('footnotes-content');
            if (footnotesContent) {
                this.updateElementEmDashes(footnotesContent);
            }
            
            // Setup footnote click handlers
            this.setupFootnoteHandlers();
            
            // Update URL and browser history
            if (updateUrl) {
                this.updateURL(filename, title);
            }
            
            // Update active state in table of contents
            this.updateActiveChapter(filename);
            
        } catch (error) {
            console.error('Error loading chapter:', error);
            document.getElementById('chapter-title').textContent = 'Error Loading Chapter';
            document.getElementById('chapter-text').innerHTML = `
                <p>Sorry, there was an error loading the chapter "${filename}". Please try again.</p>
            `;
            document.getElementById('footnotes-content').innerHTML = 
                '<p class="footnotes-placeholder">No footnotes available.</p>';
        }
    }

    getChapterTitle(filename) {
        const chapter = this.chapters.find(c => c.filename === filename);
        return chapter ? chapter.title : filename.replace('.md', '').replace(/^\d+\s*/, '');
    }

    updateActiveChapter(filename) {
        // Remove active class from all links
        document.querySelectorAll('.table-of-contents a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to the current chapter link
        const activeLink = document.querySelector(`.table-of-contents a[data-filename="${filename}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    setupFootnoteHandlers() {
        // Add click handlers to footnote references
        document.querySelectorAll('.footnote-ref').forEach(ref => {
            ref.addEventListener('click', (e) => {
                e.preventDefault();
                const footnoteLabel = ref.dataset.footnote;
                this.handleFootnoteClick(footnoteLabel);
            });
        });
    }

    isNarrowScreen() {
        return window.innerWidth <= 900;
    }

    handleFootnoteClick(label) {
        if (this.isNarrowScreen()) {
            this.showFootnotePopup(label);
        } else {
            this.highlightFootnote(label);
        }
    }

    highlightFootnote(label) {
        // Remove previous highlights
        document.querySelectorAll('.footnote.highlighted').forEach(fn => {
            fn.classList.remove('highlighted');
        });
        
        // Find and highlight the target footnote
        const targetFootnote = document.querySelector(`.footnote[data-footnote="${label}"]`);
        if (targetFootnote) {
            targetFootnote.classList.add('highlighted');
            
            // Scroll footnote into view
            targetFootnote.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Remove highlight after a few seconds
            setTimeout(() => {
                targetFootnote.classList.remove('highlighted');
            }, 3000);
        }
    }

    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.filename) {
                // Load chapter from browser history state
                this.loadChapter(event.state.filename, false);
            } else {
                // Handle URL hash change
                this.handleURLChange();
            }
        });
        
        // Handle direct URL hash changes (e.g., typing in address bar)
        window.addEventListener('hashchange', () => {
            this.handleURLChange();
        });

        // Setup footnote popup event listeners
        this.setupPopupEventListeners();
    }

    setupPopupEventListeners() {
        const popup = document.getElementById('footnote-popup');
        const closeBtn = document.querySelector('.footnote-popup-close');
        const backdrop = document.querySelector('.footnote-popup-backdrop');

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideFootnotePopup();
            });
        }

        // Backdrop click
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.hideFootnotePopup();
            });
        }

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup && popup.classList.contains('show')) {
                this.hideFootnotePopup();
            }
        });
    }

    showFootnotePopup(label) {
        // Find the footnote content from parser's footnoteOrder
        const footnote = this.parser.footnoteOrder.find(fn => fn.label === label);
        if (!footnote) {
            console.warn('Footnote not found:', label);
            return;
        }

        const popup = document.getElementById('footnote-popup');
        const body = document.getElementById('footnote-popup-body');
        
        if (!popup || !body) {
            console.error('Popup elements not found');
            return;
        }

        // Create footnote content with proper formatting
        const processedContent = this.parser.processInlineElements(footnote.content);
        const styledContent = this.applyEmDashStyle(processedContent);
        
        const footnoteHtml = `
            <div class="footnote-content">
                <span class="footnote-label">${footnote.number}:</span>
                ${styledContent}
            </div>
        `;

        body.innerHTML = footnoteHtml;

        // Setup nested footnote handlers within the popup
        this.setupPopupFootnoteHandlers();

        // Show popup with animation
        popup.classList.add('show');
        
        // Focus management for accessibility
        const closeBtn = popup.querySelector('.footnote-popup-close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    hideFootnotePopup() {
        const popup = document.getElementById('footnote-popup');
        if (popup) {
            popup.classList.remove('show');
        }
    }

    setupPopupFootnoteHandlers() {
        // Handle footnote references within the popup
        const popupBody = document.getElementById('footnote-popup-body');
        if (!popupBody) return;

        popupBody.querySelectorAll('.footnote-ref').forEach(ref => {
            ref.addEventListener('click', (e) => {
                e.preventDefault();
                const footnoteLabel = ref.dataset.footnote;
                // Replace the current popup content instead of stacking
                this.showFootnotePopup(footnoteLabel);
            });
        });
    }

    loadEmDashPreference() {
        // Load preference from localStorage, default to unspaced (J's style)
        const saved = localStorage.getItem('emDashStyle');
        return saved === null ? false : saved === 'spaced';
    }

    saveEmDashPreference(spaced) {
        localStorage.setItem('emDashStyle', spaced ? 'spaced' : 'unspaced');
    }

    setupEmDashToggle() {
        const toggle = document.getElementById('emdash-toggle');
        if (!toggle) {
            console.warn('Em-dash toggle element not found');
            return;
        }

        console.log('Setting up em-dash toggle, initial state:', this.spacedEmDashes);

        // Set initial state
        toggle.checked = this.spacedEmDashes;

        // Handle toggle changes
        toggle.addEventListener('change', (e) => {
            console.log('Toggle changed to:', e.target.checked);
            this.spacedEmDashes = e.target.checked;
            this.saveEmDashPreference(this.spacedEmDashes);
            this.updateEmDashStyle();
        });
    }

    normalizeEmDashes(text) {
        // First normalize all em-dashes to a consistent format
        // Handle both spaced and unspaced variants
        return text.replace(/(\s*)—(\s*)/g, '—');
    }

    applyEmDashStyle(text) {
        // Normalize first, then apply the user's preferred style
        const normalized = this.normalizeEmDashes(text);
        
        if (this.spacedEmDashes) {
            // Convert to spaced em-dashes (M's style)
            return normalized.replace(/—/g, ' — ');
        } else {
            // Keep unspaced em-dashes (J's style) 
            return normalized;
        }
    }

    updateEmDashStyle() {
        console.log('Updating em-dash style to:', this.spacedEmDashes ? 'spaced' : 'unspaced');
        
        // Update the current chapter's content with the new em-dash style
        const chapterText = document.getElementById('chapter-text');
        if (chapterText) {
            console.log('Found chapter text element, updating...');
            // Get all text content and update em-dashes
            this.updateElementEmDashes(chapterText);
        } else {
            console.log('Chapter text element not found');
        }

        // Also update footnotes sidebar content
        const footnotesContent = document.getElementById('footnotes-content');
        if (footnotesContent) {
            console.log('Found footnotes content element, updating...');
            this.updateElementEmDashes(footnotesContent);
        } else {
            console.log('Footnotes content element not found');
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
}

// Initialize the site when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NovelSite();
});