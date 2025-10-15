# Flying Island

, or, continents incontinent, or, a largely assiduous help-meet, or, whatever

> “The clues were all there from the beginning... if you read the book backwards”
> ~M

A collaborative novel between John and a mysterious stranger.

Each chapter is a separate ~~markdown~~ johndown file.

This repository is also a bespoke software system (the "static site" aka "website" aka "wobsoot") that renders the source files into html for easy viewing in a web browser, which is largely unrelated to the content of the novel.

No AI nor LLM has been used on this project except in a technical capacity, e.g. the creation of the .gitignore and the static site.

## Rules

John and the mysterious stranger will take turns writing between 300 and 1500 words and handing off to the other. Ideal cadence is one handoff daily, but it's not a big deal if someone delays a few days. 4 days means one of us should consider saying something passive aggressive. This began 2025-07-20, although it was a get-together, as mentioned below.

Sometimes we have a little get-together and write alternating words, as a treat. This counts as the handoff (although it could be handed off to the either author upon mutual agreement, since a get-together is sort of both and neither in terms of writing, and thus a wildcard). The first of these was 2025-07-20.

You might notice that occasionally there's something wacky like a marker of 0 words or an author going twice in a row. These occur for specific reasons that seemed cool at the time, but don't worry about it.

## Story Notes

I’m thinking the current year is probably about 0x8fd (or 2301 (since what?? (The only undisputed date in history, the birth of the Christchild))).

Other timeline events (I just grepped for 0x lol):
* Squiggle had mysteriously disappeared in the year 0x8eb, two years after the Eenies got rich, moved to The Islands, and got Martin a proper private tutor.
* the Christmas of 0x8ed, when the whole clan gathered at Uncle Fresno’s ranch and it snowed so much that tunnels had to be dug

## Technical debt, todo items

Now that we have annotations maybe I will resurrect some deleted footnotes as annotations if they feel appropriate for that.

Since the johndown parser is apparently custom, we should list its features to specify it completely. If this gets long, it can be specified in johndown.md or whatever. Or just in the next section.

"ins̈om̈uch" displays as though the diaereses are standalone characters even though they are U+0308 COMBINING DIAERESIS and thus should properly float above the previous letters. Probably a font problem? Presumably because font designers don't understand that the diaeresis is productive with non-vowels as well, possibly.

Perhaps the generated html should display the word counts somewhere.

Perhaps the index, or somewhere on the website, should display this readme?

## Johndown features

It's mostly just markdown. That means: it's mostly text (encoding unspecified by johndown itself, but the only implementation is utf8 (no BOM)), but some particular text is special and makes the other text render specially instead. Um, we use this mostly for italics I guess. There are also links. And [^whatever] [^whatever]: footnotes. But there's also [$ whatever] for inline footnotes, and [@ whatever] for annotations. Annotations are conventionally signed with ~[the initial of their author], although this does not trigger any special rendering; if the annotation occurs in the text of some author and is unsigned, you can assume it's by that author. Footnotes can also be signed. We're having a good time. The provenence of footnotes is less certain by default, since we feel free to slip cool footnotes into each other's prose when we feel like it. Signing with two tildes before the initial means the footnote/annotation should probably be deleted after it is consumed (ie, for typos the other author wasn't sure about correcting). --- makes a triple-fleuron dinkus (in normal markdown it usually renders as an html hr (horizontal rule) element, I guess, but it's also described as a "thematic break", which we do use it for). A non-special bracketed phrase on its own line seems to make a hr above it, in addition to rendering in a sort of grey, italicized way.

### These features don't work 100% correctly

Unlike regular markdown, we respect single linebreaks. We also render paragraphs as beginning with indents, as God intended. On that note, we also render to a serif font, of course.

We "smarten" quotes (") and apostrophes('), but the algorithm for this is not completely correct. However, you can always use explicit “” ‘’ marks instead, and they will not get overwritten.

There's also ^superscript^ which is not a fully standard feature. Beware of mixing this with square brackets, because it _will_ get squirrelly.

If you leave an annotation with square brackets but put a linebreak in it, the second line seems to relocate down to the bottom of the chapter and display as normal text?

We currently use the md extension for johndown files, for convenience and ecosystem compatibility, but ideally we would use a jd extension for johndown files, because they unaccredited Jurum Doctores.

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

If you want to count how many words are in the novel, you can use the classic Posix command `wc -w *\ *.md`. This *will* include the annotations, however, even though these "don't count" in some spiritual sense.

## License

Currently, this repo is the completely proprietary intellectual property of its authors.
