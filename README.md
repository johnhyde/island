# Flying Island

, or, continents incontinent, or, a largely assiduous help-meet, or, whatever

> “The clues were all there from the beginning... if you read the book backwards”
> ~M

A collaborative novel between John and a mysterious stranger

Each chapter is a separate ~~markdown~~ johndown file?

No AI nor LLM has been used on this project, at least so far, except in a technical capacity, e.g. the creation of the .gitignore and the static site.

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

## Johndown features

It's mostly just markdown (maybe we should list the actual markdown features we use, but don't sweat it (actually since the johndown parser is apparently custom, maybe we **should** do this)). But there's also [$ whatever] for inline footnotes, and [@ whatever] for annotations. --- makes a triple-fleuron dinkus (in normal markdown it usually renders as an html hr (horizontal rule) element, I guess, but it's also described as a "thematic break", which we do use it for)

There's alse ^superscript^ which is not a fully standard feature. Beware of mixing this with square brackets, because it _will_ get squirrelly.

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
