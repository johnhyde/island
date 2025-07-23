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
        let processedMarkdown = markdown;
        const generatedFootnotes = [];

        // Find all inline footnotes [$content] and convert them
        processedMarkdown = processedMarkdown.replace(/\[\$([^\]]+)\]/g, (match, content) => {
            inlineCounter++;
            const autoId = `^CAPITALLETTERS${inlineCounter}`;
            
            // Store the footnote definition to append later
            generatedFootnotes.push(`[${autoId}]: ${content}`);
            
            // Replace inline footnote with regular footnote reference
            return `[${autoId}]`;
        });

        // Append generated footnote definitions to the end
        if (generatedFootnotes.length > 0) {
            processedMarkdown += '\n\n' + generatedFootnotes.join('\n');
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