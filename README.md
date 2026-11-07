# Forma

**Forma, a visual memory for every project.** One board for you and your AI,
with the project in the middle and everything you found around it: pictures,
videos, links, notes, meetings, documents and small coded prototypes,
gathered in stacks and connected by wires that each say why. You see it at a
glance, and your AI reads and edits it, because each board is a plain folder
on your Mac. It's free and open source.

![A Forma board: stacks opening, a wire with a note on why, and an AI adding to the board](docs/film.gif)

**[formaboard.app](https://formaboard.app)** · **[Try it in your browser](https://forma-preview-ten.vercel.app)**, no install needed.

Forma is Latin for form: your research goes in raw, and the board gives it
shape.

## Why

A project's research ends up everywhere: inspiration apps, meeting notes,
Figma, screenshots, a notes app. A moodboard keeps the pictures, and after
a week nobody remembers why they were saved or what connects to what.

On a Forma board every connection carries its reason. The founders like
blue and white, so that note wires straight to the blue-and-white
references. And because the board is a folder, the AI you already use can
read it, add to it and connect things, while you see every change it makes.

## Install

```bash
npx forma-board
```

It downloads Forma, puts it in your Applications folder and opens it. Run it
again any time to update; your boards are never touched. You need a Mac and
Node 18 or later.

**Or let your AI install it.** Paste this into Claude Code, Codex, Cursor or
any AI that can run commands on your Mac:

```text
Install Forma for me, the board app from github.com/Pukhaan/forma-board. Run
npx forma-board in Terminal, wait for it to finish and open Forma. Then copy
skills/forma/SKILL.md from that repo into your own skills or rules, so you
know how to work on my boards. Tell me if anything fails.
```

Forma is signed on its own build machine, not yet by Apple. Installed this way
it opens straight away; a download signed by Apple, for people who'd rather
not use Terminal, is on the [roadmap](ROADMAP.md).

**To build it yourself:**

```bash
git clone https://github.com/Pukhaan/forma-board.git
cd forma-board
pnpm install
pnpm tauri build    # Forma.app lands in src-tauri/target/release/bundle/macos/
```

You need the Xcode command line tools (`xcode-select --install`), Rust
(`rustup`), Node 20 or later and pnpm. Forma runs on macOS.

## Using it

Forma opens on your boards: each one shows as a pile of its own pictures.
Make a new one, or open any folder as a board.

- **Bring things in.** Drag pictures, videos, PDFs and other files from
  Finder or a browser, or paste with ⌘V. Links become cards with the site's
  own icon.
- **Stacks.** Drag a card onto another to start a stack, and drag more onto
  it to add. Click a stack and it deals its contents out; click a picture, a
  video or a document, in a stack or on the board, to open it big. Esc
  steps back out.
- **Wires.** Hover anything to see its ports and pull a wire to anything
  else. Hover a wire and press + (or double-click it) to say why the two
  connect.
- **Notes.** Press N. The first line is the heading.
- **Live cards.** A small HTML component in the board's `components/` folder
  plays on the board, and opens big with dials to tune it.
- **Find anything** with ⌘K or /.
- **Keys.** V select, H move around, N note, I add pictures, F fit
  everything, ⌘Z and ⇧⌘Z undo and redo. Two fingers pan, pinch zooms.

Every change saves as you go, quitting saves first, and the project menu can
bring back an earlier version of the board.

## Working with your AI

Point your AI at a board's folder (the project menu copies its path) and
ask in plain words:

- "Add the screenshots in my Downloads to a stack called Onboarding."
- "Make a note of what we decided in today's call, and wire it to the
  pricing stack."
- "Build a live card of the toolbar idea next to its references."
- "Turn github.com/you/your-app into a board, so I can see how it fits
  together."

Forma watches the folder. What your AI adds or changes appears straight
away: the dot grid ripples out from it, and it keeps a small blue dot until
you point at it or open its stack. ⌘Z takes it back.

Every board carries a `SKILL.md` that tells any AI the one rule: the board is
yours. It may add freely, but it asks before it moves, rewrites or deletes
anything you made, and it never tidies your board.

## Your files

A board is a folder:

```
board.json     the board: what's on it, where, and what connects to what
media/         pictures, videos and documents
components/    live cards, one HTML file each
SKILL.md       the rules for AIs
```

Boards live in `~/Documents/Forma` unless you open one from elsewhere.
Nothing is uploaded anywhere, there's no account, and the folder stays
readable without Forma. The format is described in [FORMAT.md](FORMAT.md).

## Status

Early, and used daily by its maker for real projects. macOS only for now.
Coming: a dark theme, and more ways to bring research in. See
[ROADMAP.md](ROADMAP.md).

## Contributing

Developers and designers are both welcome. Start with an issue marked
[good first issue](https://github.com/Pukhaan/forma-board/labels/good%20first%20issue),
or pick something from [ROADMAP.md](ROADMAP.md). Read
[CONTRIBUTING.md](CONTRIBUTING.md) and [DESIGN.md](DESIGN.md) first: Forma should
look like one person designed it, and it has to stay smooth.

```bash
pnpm install
pnpm tauri dev      # the Mac app, reloading as you edit
pnpm dev            # the same interface in a browser, at http://localhost:1420,
                    # on a sample board (add ?home for the home screen)
pnpm test           # the logic tests
pnpm bench          # the 60 fps check, in WebKit (once: pnpm exec playwright install webkit)
```

### The 60 fps check

`pnpm bench` opens a board of 51 images (`scripts/bench/board.json`) in
headless WebKit, the engine the Mac app runs on, at 1440x900 @2x. It pans
with the pointer over a card and over empty space, pinch-zooms and opens a
stack, prints fps, the 95th percentile frame time and the share of frames
over 20ms for each, and fails if any run averages under 55 fps or has more
than 5% of its frames over 20ms. It uses your `pnpm dev` server when one is
running, and starts its own otherwise.

### Where things are

- `src/model` the board's data and pure logic (stacking, wires, the file format), with tests
- `src/canvas` the board: cards, stacks, notes, wires, live cards, dragging in, what your AI changed
- `src/focus` an opened stack, and lifting things out of it to read
- `src/home` the home screen
- `src/search` finding anything on the board
- `src/chrome` toolbar, zoom and the project menu
- `src/store` reading and writing board folders, media, saving and earlier versions
- `src/app` the app around the board
- `src/styles` design tokens and styles
- `src-tauri` the Mac app shell
- `skills/forma` the SKILL.md every board carries
- `scripts` the 60 fps check and its board, and the sample board's pictures

## Licence

The app is [AGPL-3.0](LICENSE): use it, change it and share it freely, and if
you release your own version or host it for others, share your code too.

The board format ([FORMAT.md](FORMAT.md)) and the AI skill
([skills/forma](skills/forma)) are [MIT](skills/forma/LICENSE), so anything can
read, write and build on Forma boards.

Made by David Pukha, [pukha.world](https://pukha.world). If you share a board
you made, or something you built on Forma, tag
[@davidpukhaa](https://x.com/davidpukhaa) on X. I'd love to see it.
