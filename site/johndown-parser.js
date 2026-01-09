/**
 * Simple johndown parser focused on the novel's needs
 * Handles: paragraphs, emphasis, strong text, footnote references, and footnote definitions
 */
class JohndownParser {
  constructor() {
    this.footnotes = new Map();
    this.footnoteLabels = new Map(); // Maps author labels to sequential numbers
    this.footnoteOrder = []; // Tracks order of first appearance
    this.footnoteCounter = 0;
    this.annotations = new Set();
  }

  isAnnotationLabel(label) {
    return this.annotations.has(label);
  }

  parse(johndown) {
    // Reset footnotes for each parse
    this.footnotes.clear();
    this.footnoteLabels.clear();
    this.footnoteOrder = [];
    this.footnoteCounter = 0;

    // First pass: preprocess inline footnotes [$content] -> [^CAPITALLETTERS#]
    const preprocessedJohndown = this.preprocessInlineFootnotes(johndown);

    // Second pass: extract footnote definitions
    const { content, footnoteMap } = this.extractFootnotes(
      preprocessedJohndown,
    );
    this.footnotes = footnoteMap;

    // Third pass: scan for footnote references to determine order
    this.assignFootnoteNumbers(content);

    // Fourth pass: convert johndown to HTML
    const html = this.convertToHtml(content);

    return {
      html: html,
      footnotes: this.footnotes,
      footnoteOrder: this.footnoteOrder,
      annotations: this.annotations,
    };
  }

  preprocessInlineFootnotes(johndown) {
    let inlineCounter = 0;
    const generatedFootnotes = [];

    // Recursive function to process both inline footnotes and annotations from outer to inner
    const processInlineFootnotesRecursively = (text) => {
      // Find the first [$...] or [@...] construct with proper bracket matching
      let i = 0;
      while (i < text.length) {
        // Look for [$ or [@
        if ((text.substr(i, 2) === "[$") || (text.substr(i, 2) === "[@")) {
          let bracketDepth = 0;
          let start = i;
          let j = i;
          const isAnnotation = text.substr(i, 2) === "[@";

          // Find the matching closing bracket
          while (j < text.length) {
            if (text[j] === "[") {
              bracketDepth++;
            } else if (text[j] === "]") {
              bracketDepth--;
              if (bracketDepth === 0) {
                // Found the matching closing bracket
                const fullMatch = text.substring(start, j + 1);
                let content = text.substring(start + 2, j); // Remove [$ or [@ and ]

                // Strip optional space after $ or @
                content = content.trim();
                const autoId = `^CAPITALLETTERS${++inlineCounter}`;
                let replacement = `[${autoId}]`;
                const processedContent = processInlineFootnotesRecursively(
                  content,
                );

                if (isAnnotation) {
                  this.annotations.add(autoId);
                }
                generatedFootnotes.push(
                  `${replacement}: ${processedContent}`,
                );

                // Replace and continue processing
                text = text.substring(0, start) + replacement +
                  text.substring(j + 1);
                i += replacement.length - 1;
                break;
              }
            }
            j++;
          }
        }
        i++;
      }

      // No more inline footnotes or annotations found, return the text as-is
      return text;
    };

    const processedJohndown = processInlineFootnotesRecursively(johndown);

    // Append generated footnote definitions to the end
    if (generatedFootnotes.length > 0) {
      return processedJohndown + "\n\n" + generatedFootnotes.join("\n");
    }

    return processedJohndown;
  }

  extractFootnotes(johndown) {
    const footnoteMap = new Map();
    const lines = johndown.split("\n");
    const contentLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for footnote definition: [^label]: content
      const footnoteMatch = line.match(/^\[(\^[^\]]+)\]:\s*(.*)$/);
      if (footnoteMatch) {
        const [, label, content] = footnoteMatch;
        if (label.slice(0, 2) == "^@") {
          this.annotations.add(label);
        }

        // Collect multi-line footnote content
        let footnoteContent = content;
        let j = i + 1;
        while (
          j < lines.length && lines[j].match(/^\s+/) &&
          !lines[j].match(/^\[(\^[^\]]+)\]:/)
        ) {
          footnoteContent += " " + lines[j].trim();
          j++;
        }
        i = j - 1; // Skip the lines we've processed

        footnoteMap.set(label, footnoteContent);
      } else {
        contentLines.push(line);
      }
    }

    return {
      content: contentLines.join("\n"),
      footnoteMap: footnoteMap,
    };
  }

  convertToHtml(johndown) {
    // Extract and preserve <pre> blocks before splitting into paragraphs
    const preBlocks = [];
    let processedJohndown = johndown.replace(
      /<pre>([\s\S]*?)<\/pre>/g,
      (match, content) => {
        const placeholder = `___PRE_BLOCK_${preBlocks.length}___`;
        preBlocks.push(content);
        return placeholder;
      },
    );

    // Split into paragraphs
    const paragraphs = processedJohndown.split(/\s*\n\s*/);
    let html = "";

    for (let paragraph of paragraphs) {
      paragraph = paragraph.trim();
      if (!paragraph) continue;

      // Handle <pre> block placeholders
      const preMatch = paragraph.match(/^___PRE_BLOCK_(\d+)___$/);
      if (preMatch) {
        const preContent = preBlocks[parseInt(preMatch[1])];
        // Process inline elements (footnotes/annotations) but preserve whitespace
        const processedPreContent = this.processInlineElements(preContent);
        html += `<pre>${processedPreContent}</pre>\n`;
        continue;
      }

      // Skip author attribution lines like [M; 397 words] or [J; 678 words]
      if (paragraph.match(/^\[[^^]*\]/)) {
        html += `<div class="author-note">${
          this.processInlineElements(paragraph)
        }</div>\n`;
        continue;
      }

      // Handle blockquotes: lines starting with >
      if (paragraph.match(/^>/)) {
        // Process blockquote content (remove > and optional space)
        const blockquoteContent = paragraph.replace(/^>\s?/gm, "");
        let processedBlockquote = this.processInlineElements(blockquoteContent);
        html += `<blockquote>${processedBlockquote}</blockquote>\n`;
        continue;
      }

      // Handle horizontal rules: lines with ---
      if (paragraph.match(/^-{3,}$/)) {
        html += `<div class="section-separator">❦ ❦ ❦</div>\n`;
        continue;
      }

      // Handle drop cap syntax
      if (paragraph.startsWith("{")) {
        paragraph = paragraph.slice(1);
        let separate = false;
        if (paragraph.startsWith("{")) {
          paragraph = paragraph.slice(1);
          separate = true;
        }
        let endCaps = paragraph.indexOf("}");
        let startRest = endCaps + 1;
        if (endCaps === -1) {
          endCaps = paragraph.match(/\W/);
          endCaps = endCaps ? endCaps.index : 1;
          startRest = endCaps;
        }
        const dropCapText = paragraph.slice(0, endCaps);
        const restText = paragraph.slice(startRest);

        // Split drop cap into first letter and rest
        const firstLetter = dropCapText.charAt(0);
        const restOfDropCap = dropCapText.slice(1);
        const shortDropCap = firstLetter.match(/["“”'‘’]/);

        paragraph = `<span class="drop-cap-letter ${
          shortDropCap ? "short" : ""
        }">${firstLetter}</span><span class="drop-cap-rest ${
          separate ? "separate" : ""
        }">${restOfDropCap}</span>${restText}`;
      }

      // Process the paragraph content
      const processedParagraph = this.processInlineElements(paragraph);
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

          if (
            !processedLabels.has(label) && this.footnotes.has(label)
          ) {
            processedLabels.add(label);
            if (!this.isAnnotationLabel(label)) {
              this.footnoteCounter++;
              this.footnoteLabels.set(label, this.footnoteCounter);
            }

            const footnoteContent = this.footnotes.get(label);
            this.footnoteOrder.push({
              label: label,
              number: this.footnoteCounter,
              content: footnoteContent,
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
    let parts = text.split(/(?:(?<=<.*?>)|(?=<.*?>))/);
    if (parts.length > 1) {
      return parts.map(this.processInlineElements.bind(this)).join("");
    } else {
      text = parts[0];
    }
    if (text.match(/^<.*>$/)) {
      return text;
    }
    text = this.processQuotes(text);
    // Process footnote references: [^label] -> numbered superscripts
    text = text.replace(/\[(\^[^\]]+)\]/g, (match, label) => {
      if (this.isAnnotationLabel(label)) {
        return `<span class="annotation-ref" data-id="${label}">@</span>`;
      }
      const number = this.footnoteLabels.get(label) || "?";
      return `<sup class="footnote-ref" data-id="${label}">${number}</sup>`;
    });

    text = text.replace(
      /\[(.*?)\]\((.*?)\)/g,
      `<a href="$2" target="_blank">$1</a>`,
    );

    // Process other inline styling
    text = this.processInlineStyling(text);

    return text;
  }

  processQuotes(text) {
    text = text.replace(/(?!^)(?<![\s\n])"/g, "”");
    text = text.replace(/"/g, "“");
    text = text.replace(/(?!^)(?<![\s\n“])'/g, "’");
    text = text.replace(/'/g, "‘");

    return text;
  }

  processInlineStyling(text) {
    // Process emphasis: _text_
    text = text.replace(/\b_([^_]+?)_\b/g, "<em>$1</em>");

    // Process strong: **text**
    text = text.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");

    // Process italic: *text* (but not if it's already in emphasis)
    text = text.replace(/(?<!<em>)\*([^*]+?)\*(?![^<]*<\/em>)/g, "<em>$1</em>");

    // Process highlighted text: ==text==
    text = text.replace(/==([^=]+?)==/g, "<mark>$1</mark>");

    // Process strikethrough: ~~text~~
    text = text.replace(/~~([^~]+?)~~/g, "<del>$1</del>");

    // Process superscript: ^text^
    text = text.replace(/(?<!data-id=")\^([^^]+?)\^/g, "<sup>$1</sup>");

    return text;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatFootnotes() {
    let footnotesHtml = "";

    // Use the ordered footnotes with sequential numbers
    for (const footnote of this.footnoteOrder) {
      if (this.isAnnotationLabel(footnote.label)) continue;
      const processedContent = this.processInlineElements(footnote.content);
      footnotesHtml += `
                <div class="footnote" data-id="${footnote.label}">
                    <span class="footnote-label">${footnote.number}:</span>
                    ${processedContent}
                </div>
            `;
    }
    if (footnotesHtml.length === 0) {
      return '<p class="footnotes-placeholder">No footnotes in this chapter.</p>';
    }

    return footnotesHtml;
  }
}
