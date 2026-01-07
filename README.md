# Flying Island

, or, continents incontinent, or, a largely assiduous help-meet, or, whatever

> “The clues were all there from the beginning... if you read the book backwards”
> ~M

A collaborative novel between John and a mysterious stranger.

Each chapter is a separate ~~markdown~~ johndown file (see below for a description of this format). These are numbered with two digits, followed by a space.

Some of them are lettered with two capital letters, which means they exist ambiguously in the future of the novel and haven't been entered into a concrete order yet. You don't have to read those; they essentially function as rough drafts for whoever wrote them, and in some cases might get removed entirely and lifted to another project. Let M know if this is annoying and should be stopped.

However, files lettered with a capital A and then a digit are appendices and are now canon, in some way or another, although they are in a special order reserved for appendices.

This repository is also a bespoke software system (the "static site" aka "website" aka "wobsoot") that renders the source files into html for easy viewing in a web browser, which is largely unrelated to the content of the novel. It's not an elegant or entirely correct system, but she gets the job done and that's all that matters. Large parts of it were also AI-generated, so if you're maintaining it and thinking "why does it...?" then there may be no reason.

No AI nor LLM has been used on this project except in a technical capacity, e.g. the creation of the .gitignore, the pre-commit hook, and the static site. Additionally, from time to time the authors asked an LLM to comb over the text-as-written and explain it to us, to try to figure out what was going on with the plot, in case we had forgotten something. But it was never allowed to write in our blessèd words; never allowed to speak in our holy tongue.[^tongue]

[^tongue]: This latter locution is from "all robots & computers must shut the hell up", by Welcome to My Meme Page.

## Rules

John and the mysterious stranger will take turns writing between 300 and 1500 words and handing off to the other. Ideal cadence is one handoff daily, but it's not a big deal if someone delays a few days. 4 days means one of us should consider saying something passive aggressive. This began 2025-07-20, although it was a get-together, as mentioned below. When a third author joined, it became necessary to determine whether this was a strict rota or if the opportunity goes to whoever first claims it — the latter system was chosen, although this may be changed to the alternative if it proves infelicitous.

The wordcount is based on the text including footnotes but not annotations. However, it's usually inconvenient to exclude the annotations from the word count, so including them a little is fine. You can do the wordcount in whatever program you like, even though many programs have different reckonings of wordcounts. It's only a rough number, really. Plus, we tend to edit little things later, like slipping in a footnote, and then not change the listed wordcount.

Sometimes we have a little get-together and write alternating words, as a treat. This counts as the handoff (although it could be handed off to the either author upon mutual agreement, since a get-together is sort of both and neither in terms of writing, and thus a wildcard). The first of these was 2025-07-20.

You might notice that occasionally there's something wacky like a marker of 0 words or an author going twice in a row. These occur for specific reasons that seemed cool at the time, but don't worry about it.

In 2026, about halfway(?) through the novel, M selected a New Year's Resolution of "No more research projects. I will not even be googling the words of parts of objects I don't know anymore." figuring that it would lead to faster novel creation. This dramatically decreased the quality of M's sections, leading to such locutions as "a very fluffy white dress shirt like a guy in a movie about the Renaissance". But, on the other hand, those sections were written much quicker, and M got to spend more time going to parties. The other authors were free to do whatever.

## Story Notes

The current year is 0x8fd (or 2301 (since what?? (The only undisputed date in history, the birth of the Christchild [disputed]))).

Other timeline events (I just grepped for 0x lol):
* Squiggle had mysteriously disappeared in the year 0x8eb, two years after the Eenies got rich, moved to The Islands, and got Martin a proper private tutor.
* the Christmas of 0x8ed, when the whole clan gathered at Uncle Fresno’s ranch and it snowed so much that tunnels had to be dug

## Technical debt, todo items

![alt text](file to embed.whatever "Title text") is the way to embed other data in markdown, most commonly, but we haven't implemented it yet. It's as good as any other scheme, I suppose, except for its obvious flaws, and johndown does tend to stay compatible with markdown where it can. We do *use* this syntax already. We just don't implement it. Luckily at the moment it creates a normal link, which is useable if not ideal.

The rule where a normal bracketed phrase on its own line is always treated like a section changeover marker occasionally creates false-positives and maybe this should be given some kind of sigil instead.

Now that we have annotations maybe I will resurrect some deleted footnotes as annotations if they feel appropriate for that.

I'm thinking that instead of just [@ blah] with ~ signatures we should all have our own special sigils. So I could leave annotations like, um, [~M blah]. And then I guess that would render like as though [@ blah ~M] I guess.

Since the johndown parser is apparently custom, we should list its features to specify it completely. I'm not sure if this is already accomplished.

"ins̈om̈uch" displays as though the diaereses are standalone characters even though they are U+0308 COMBINING DIAERESIS and thus should properly float above the previous letters. Probably a font problem? Presumably because font designers don't understand that the diaeresis is productive with non-vowels as well, possibly.

Perhaps the generated html should display the word counts since the last section break somewhere, for easy in-situ counting.

Perhaps the index, or somewhere on the website, should display this readme? (This readme is written in markdown, not johndown, but that doesn't matter much. Just render it "wrong", who cares?)

A footnote in an annotation currently displays in the sidebar even if the annotations are hidden. Probably they should actually be in their own special annotations-footnotes section (which will prevent them from messing up the numbering of the normal footnotes), which probably should have a red background.

Possibly render author signature tildes as long tildes instead, like ～,〜, ⁓, or 〰 (instead of a plain ~)?

<span lang="es-MX">sin</span> should probably be turned into [lang:es-MX sin] or something like that.

νους (nous) should probably be lang:grc on both of those individually

Two percent signs (%) is a to-do mark that indicates the temporarily-embarrassed author M must return and complete something in the text. This has no special rendering associated with it, and they all should be gone by the completion of the novel.

We should probably have triple backticks to make "pre" (wrap) blocks, as they call them in html, since right now we're using them in two places, one in the actual novel itself, semantically important, which is maybe not ideal (and puts the lie to "html-passthrough [...] can be ignored", written later in this document).

### These johndown features don't work 100% correctly

We "smarten" quotes (") and apostrophes('), but the algorithm for this is not completely correct. However, you can always use explicit “” ‘’ marks instead, and they will not get overwritten.

The chapter titles also are not smartened.

[@ I have a sort of irrational dislike of using anything but ' for an apostrophe, because that's the character which is U+0027 APOSTROPHE, dammit! However, I have done it before, and will do it again; and, in conventional typesetting, there is no typographical difference between an apostrophe and and curly close single (much to my chagrin). Anyway, even though we could fix the autocurling algorithm a little, it seems unlikely to me that we will make it smart enough to do some types of apostrophes (such as a leading apostrophe before a word) correctly (it's legitimately ambiguous whether it's an apostrophe or a quote and you have to figure out if there's a quotation there by understanding the rules of English and/or parsing along the line for a hypothesized closing quote (which may also be ambiguous). Or, I suppose, we could ban autocurling of single quotes, and then it wouldn't be ambiguous. But what about the chapter where our heros enter a parody of a british novel, what then?! ~M] [@ Also, we still want to display the apostrophe as non-straight, which without character replacement is a font problem that fonts typically aren't up to the task of. ~M] [@ These are written like annotations to indicate they're an aside; however, this document explains johndown syntax so it won't make sense if you render this document as johndown. ~M]

There's also ^superscript^ which is not a fully standard markdown feature. Beware of mixing this with square brackets, because it _will_ get squirrelly.

Johndown is currently implemented as a line-based parser, which is at odds with its syntax. If you leave an annotation with square brackets but put a linebreak in it, the second line seems to relocate down to the bottom of the chapter and display as normal text?

## Johndown features

The file extension for johndown files is jd, because they are unaccredited Jurum Doctores.

Johndown mostly just a regular text file, but some particular text is special and makes the other text render specially instead.

The textual encoding is unspecified by johndown itself, but the only implementation is utf8 (no BOM required) — which is a good one.

Johndown's basic features are quite similar to markdown. Thence its name.

Unlike regular markdown, we respect single linebreaks. (Multiple line breaks are also interpreted the same as single line breaks.) We also render paragraphs as beginning with indents, as God intended. On that note, we also render to a pleasant serif font, of course.

Um, we use this mostly for italics and stuff I guess. *italic*. **bold**. ***bold italic***. _Also italic_. **_presumably also bold italic although I haven't checked_**. ~~strikethrough~~. There's also ^superscript^ which is not a fully standard markdown feature.

There are also [links](example.com).

Drop caps and small caps can be added to the beginning of a paragraph using curly braces. If a paragraph starts with `{`, the text up to a closing `}` (or just the first word if there is no `}`) will be rendered with the first letter as a large drop capital and the remaining letters in small caps. The small caps are positioned close to the drop cap, indicating that a word is being continued from the large capital. For example, `{Islands} today...` renders with a large "I" and "SLANDS" in small caps tight against it, followed by normal text.

When starting a paragraph with a quotation mark or a single-letter word (like "A"), you should use the double-brace syntax `{{` to prevent the small caps from appearing too close to the drop cap. For example, `{{"Dialogue here"}` or `{{A special case}` will render with proper spacing between the drop cap and the small caps text that follows.

And [^whatever] [^whatever]: footnotes. But there's also [$ whatever] for inline footnotes, and [@ whatever] for inline annotations. Annotations can also be written in footnote style: [^@label] with a corresponding definition [^@label]: annotation text. Annotations are conventionally signed with the initial of their author after a tilde, although this does not trigger any special rendering. If an annotation occurs in the text of some author and is unsigned, you can assume it's by that author. Footnotes can also be signed. We're having a good time. The provenance of footnotes is less certain by default, since we feel free to slip cool footnotes into each other's prose when we feel like it — however, it's also less important, in a sense, since the footnotes are part of the story, which is a unified whole we are communally writing (the annotations are often banal commentary we're making on it). Signing with two tildes before the initial is a convention meaning the footnote/annotation should probably be deleted after it is consumed (ie, for typos the other author wasn't sure about correcting).

--- makes a specially-rendered triple-fleuron dinkus (❦ ❦ ❦) (in normal markdown it usually renders as an html hr (horizontal rule) element, I guess, but it's also described as a "thematic break", which we do use it for).

A non-special bracketed phrase on its own line makes an hr above it, in addition to rendering in a sort of grey, italicized way.

There's some kind of html-passthrough, which was added ultimately because M thought we were already using a standard markdown renderer which would already do that... but this is underspecified and can be ignored.

## Site generation malarkey

### Setup

After cloning this repository, you may want to install the git hook to automatically maintain the chapter index:

```bash
./install-hooks.sh
```

This sets up a pre-commit hook that automatically runs `./build.sh` and updates `site/chapters.json` whenever you commit chapter files.

### Reading the Novel

To read the novel in a clean, web-based format:

1. Rebuild the chapter index if necessary:
   ```bash
   ./build.sh
   ```

2. Serve the static site:
   ```bash
   ./serve.sh
   ```

3. Open your browser to `http://localhost:8025`

**Note**: With the git hooks installed, `site/chapters.json` is automatically updated when you commit chapter files. Manual `./build.sh` runs are only needed for local preview before committing.

## Word counting

If you want to count how many words are in the novel, you can use ./wordcount.sh

## License

Currently, this repo is the completely proprietary intellectual property of its authors.

The favicon is a crop of https://commons.wikimedia.org/wiki/File:The_Works_of_the_Rev._Jonathan_Swift,_Volume_6-217.png, an edit by Jasonanaggie of an image that appears in a book written by Johnathan Swift (did Swift himself draw it? unclear to me). Therefore the favicon is also licensed under CC BY-SA 4.0.
