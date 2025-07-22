# Flying Island

, or, continents incontinent, or, a largely assiduous help-meet, or, whatever

A collaborative novel between John and a mysterious stranger

Each chapter is a separate markdown file?

No AI nor LLM has been used on this project, at least so far (except in a technical capacity, e.g. the creation of the .gitignore and the static site).

## Setup

After cloning this repository, you may want to install the git hook to automatically maintain the chapter index:

```bash
./install-hooks.sh
```

This sets up a pre-commit hook that automatically runs `./build.sh` and updates `site/chapters.json` whenever you commit chapter files.

## Reading the Novel

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

## Rules

John and the mysterious stranger will take turns writing between 300 and 1500 words and handing off to the other. Ideal cadence is one handoff daily, but it's not a big deal if someone delays a few days. 4 days means one of us should consider saying something passive aggressive. This began 2025-07-20, although it was a get-together, as mentioned below.

Sometimes we have a little get-together and write alternating words, as a treat. This counts as the handoff (although it could be handed off to the either author upon mutual agreement, since a get-together is sort of both and neither in terms of writing, and thus a wildcard). The first of these was 2025-07-20.
