/**
 * Simple markdown parser focused on the novel's needs
 * Handles: paragraphs, emphasis, strong text, footnote references, and footnote definitions
 */
class MarkdownParser {
    constructor() {
        this.footnotes = new Map();
        this.footnoteLabels = new Map(); // Maps author labels to sequential numbers
        this.footnoteOrder = []; // Tracks order of first appearance
        this.footnoteCounter = 0;
    }

    parse(markdown) {
        // Reset footnotes for each parse
        this.footnotes.clear();
        this.footnoteLabels.clear();
        this.footnoteOrder = [];
        this.footnoteCounter = 0;

        // First pass: preprocess inline footnotes [$content] -> [^CAPITALLETTERS#]
        const preprocessedMarkdown = this.preprocessInlineFootnotes(markdown);

        // Second pass: extract footnote definitions
        const { content, footnoteMap } = this.extractFootnotes(preprocessedMarkdown);
        this.footnotes = footnoteMap;

        // Third pass: scan for footnote references to determine order
        this.assignFootnoteNumbers(content);

        // Fourth pass: convert markdown to HTML
        const html = this.convertToHtml(content);

        return {
            html: html,
            footnotes: this.footnotes,
            footnoteOrder: this.footnoteOrder
        };
    }

    preprocessInlineFootnotes(markdown) {
        let inlineCounter = 0;
        const generatedFootnotes = [];

        // Recursive function to process both inline footnotes and annotations from outer to inner
        const processInlineFootnotesRecursively = (text) => {
            // Find the first [$...] or [@...] construct with proper bracket matching
            let i = 0;
            while (i < text.length) {
                // Look for [$ or [@
                if ((text.substr(i, 2) === '[$') || (text.substr(i, 2) === '[@')) {
                    let bracketDepth = 0;
                    let start = i;
                    let j = i;
                    const isAnnotation = text.substr(i, 2) === '[@';
                    
                    // Find the matching closing bracket
                    while (j < text.length) {
                        if (text[j] === '[') {
                            bracketDepth++;
                        } else if (text[j] === ']') {
                            bracketDepth--;
                            if (bracketDepth === 0) {
                                // Found the matching closing bracket
                                const fullMatch = text.substring(start, j + 1);
                                let content = text.substring(start + 2, j); // Remove [$ or [@ and ]
                                
                                // Strip optional space after $ or @
                                content = content.replace(/^\s+/, '');
                                
                                let replacement;
                                if (isAnnotation) {
                                    // Handle annotation - create annotation span
                                    const annotationId = `annotation-${++inlineCounter}`;
                                    replacement = `<span class="annotation" data-content="${this.escapeHtml(content.trim())}" data-id="${annotationId}">@</span>`;
                                } else {
                                    // Handle inline footnote - generate auto-ID and footnote definition
                                    const autoId = `^CAPITALLETTERS${++inlineCounter}`;
                                    
                                    // Recursively process the content for nested inline footnotes/annotations
                                    const processedContent = processInlineFootnotesRecursively(content);
                                    
                                    // Store the footnote definition
                                    generatedFootnotes.push(`[${autoId}]: ${processedContent}`);
                                    
                                    replacement = `[${autoId}]`;
                                }
                                
                                // Replace and continue processing
                                const newText = text.substring(0, start) + replacement + text.substring(j + 1);
                                return processInlineFootnotesRecursively(newText);
                            }
                        }
                        j++;
                    }
                    
                    // If we get here, there's an unmatched [$ or [@ - treat it as regular text
                    i++;
                } else {
                    i++;
                }
            }
            
            // No more inline footnotes or annotations found, return the text as-is
            return text;
        };

        const processedMarkdown = processInlineFootnotesRecursively(markdown);

        // Append generated footnote definitions to the end
        if (generatedFootnotes.length > 0) {
            return processedMarkdown + '\n\n' + generatedFootnotes.join('\n');
        }

        return processedMarkdown;
    }

    extractFootnotes(markdown) {
        const footnoteMap = new Map();
        const lines = markdown.split('\n');
        const contentLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for footnote definition: [^label]: content
            const footnoteMatch = line.match(/^\[(\^[^\]]+)\]:\s*(.*)$/);
            if (footnoteMatch) {
                const [, label, content] = footnoteMatch;
                
                // Collect multi-line footnote content
                let footnoteContent = content;
                let j = i + 1;
                while (j < lines.length && lines[j].match(/^\s+/) && !lines[j].match(/^\[(\^[^\]]+)\]:/)) {
                    footnoteContent += ' ' + lines[j].trim();
                    j++;
                }
                i = j - 1; // Skip the lines we've processed
                
                footnoteMap.set(label, footnoteContent);
            } else {
                contentLines.push(line);
            }
        }
        
        return {
            content: contentLines.join('\n'),
            footnoteMap: footnoteMap
        };
    }

    convertToHtml(markdown) {
        // Split into paragraphs
        const paragraphs = markdown.split(/\n\s*\n/);
        let html = '';

        for (let paragraph of paragraphs) {
            paragraph = paragraph.trim();
            if (!paragraph) continue;

            // Skip author attribution lines like [M; 397 words] or [J; 678 words]
            if (paragraph.match(/^\[([MJ]);\s*\d*\s*words?\]$/)) {
                html += `<div class="author-note">${this.escapeHtml(paragraph)}</div>\n`;
                continue;
            }

            // Skip other bracketed metadata
            if (paragraph.match(/^\[.*\]$/)) {
                html += `<div class="author-note">${this.escapeHtml(paragraph)}</div>\n`;
                continue;
            }

            // Handle blockquotes: lines starting with >
            if (paragraph.match(/^>/)) {
                // Process blockquote content (remove > and optional space)
                const blockquoteContent = paragraph.replace(/^>\s?/gm, '');
                let processedBlockquote = this.processInlineElements(blockquoteContent);
                html += `<blockquote>${processedBlockquote}</blockquote>\n`;
                continue;
            }

            // Handle horizontal rules: lines with ---
            if (paragraph.match(/^-{3,}$/)) {
                html += `<div class="section-separator">❦ ❦ ❦</div>\n`;
                continue;
            }

            // Process the paragraph content
            let processedParagraph = this.processInlineElements(paragraph);
            html += `<p>${processedParagraph}</p>\n`;
        }

        return html;
    }

    assignFootnoteNumbers(content) {
        // Depth-first search for footnote references
        const processedLabels = new Set();
        
        const processFootnotesInText = (text) => {
            const footnoteRefs = text.match(/\[\^[^\]]+\]/g);
            
            if (footnoteRefs) {
                for (const ref of footnoteRefs) {
                    const label = ref.slice(1, -1); // Remove [^ and ]
                    
                    if (!processedLabels.has(label) && this.footnotes.has(label)) {
                        processedLabels.add(label);
                        this.footnoteCounter++;
                        this.footnoteLabels.set(label, this.footnoteCounter);
                        
                        const footnoteContent = this.footnotes.get(label);
                        this.footnoteOrder.push({
                            label: label,
                            number: this.footnoteCounter,
                            content: footnoteContent
                        });
                        
                        // Recursively process nested footnotes immediately (depth-first)
                        processFootnotesInText(footnoteContent);
                    }
                }
            }
        };
        
        processFootnotesInText(content);
    }

    processInlineElements(text) {
        // Process footnote references: [^label] -> numbered superscripts
        text = text.replace(/\[(\^[^\]]+)\]/g, (match, label) => {
            const number = this.footnoteLabels.get(label) || '?';
            return `<sup class="footnote-ref" data-footnote="${label}">${number}</sup>`;
        });

        // Process emphasis: _text_
        text = text.replace(/\b_([^_]+?)_\b/g, '<em>$1</em>');

        // Process strong: **text**
        text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');

        // Process italic: *text* (but not if it's already in emphasis)
        text = text.replace(/(?<!<em>)\*([^*]+?)\*(?![^<]*<\/em>)/g, '<em>$1</em>');

        // Process highlighted text: ==text==
        text = text.replace(/==([^=]+?)==/g, '<mark>$1</mark>');

        // Process strikethrough: ~~text~~
        text = text.replace(/~~([^~]+?)~~/g, '<del>$1</del>');

        // Process superscript: ^text^
        text = text.replace(/\^([^^]+?)\^/g, '<sup>$1</sup>');

        return text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFootnotes() {
        let footnotesHtml = '';
        
        if (this.footnoteOrder.length === 0) {
            return '<p class="footnotes-placeholder">No footnotes in this chapter.</p>';
        }

        // Use the ordered footnotes with sequential numbers
        for (const footnote of this.footnoteOrder) {
            const processedContent = this.processInlineElements(footnote.content);
            footnotesHtml += `
                <div class="footnote" data-footnote="${footnote.label}">
                    <span class="footnote-label">${footnote.number}:</span>
                    ${processedContent}
                </div>
            `;
        }
        
        return footnotesHtml;
    }
}