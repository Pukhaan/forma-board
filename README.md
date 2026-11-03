# Forma

**Forma, a research board for designers.** One board per project, with the
project in the middle and everything you found around it: pictures, videos,
links, notes, documents and small coded prototypes, gathered in stacks and
connected by wires that each say why. It's a Mac app, it's free, and each
board is a plain folder on your Mac that you and your AI edit together.

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

Forma installs through your AI. Paste this into Claude Code, Codex, Cursor
or any AI that can run commands on your Mac:

```text
Install Forma for me, the research board app from
https://github.com/Pukhaan/forma-board. Clone it into ~/Developer/forma-board,
install what it needs to build (Xcode command line tools, Rust through
rustup, Node 20 or later, pnpm), then run `pnpm install` and
`pnpm tauri build`. Copy the built Forma.app from
src-tauri/target/release/bundle/macos/ into /Applications and open it.
Also copy skills/forma/SKILL.md into your own skills or rules folder, so you
know how to work on my Forma boards. Tell me if anything fails, and don't
change any of my files outside that folder.
```

The first build takes a few minutes. Because the app is built on your own
Mac, it opens without the "unidentified developer" warning.

**To update,** tell your AI: "update my Forma". It pulls the latest version
in ~/Developer/forma-board and builds and copies it the same way. Your
boards are never touched by an update.

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
  it to add. Click a stack and it deals its contents out; click a picture or
  a document to lift it toward you and read it. Esc steps back out.
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

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [DESIGN.md](DESIGN.md) first.
Forma should look like one person designed it, and it has to stay smooth.

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
- `scripts` the 60 fps check and its board

## Licence

AGPL-3.0. See [LICENSE](LICENSE).

Made by David Pukha, [pukha.world](https://pukha.world).
