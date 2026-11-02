# Forma

A local-first research canvas for designers. Forma is Latin for form: your
research goes in raw, and the board gives it shape. (It comes from the myth of
Pygmalion, the sculptor whose statue came to life.)

Inspiration, notes, research and meetings live as plain files in a project
folder; the app draws them as stacks and connections around the project they
belong to. AI tools can read and edit the same folder directly, so you and
your AI work on one board.

Status: early design phase. The board runs on sample data saved in the
browser. The project-folder file layer comes next.

## Run it

```bash
pnpm install
pnpm tauri dev      # the Mac app
pnpm dev            # the same interface in a browser, at http://localhost:1420
                    # (add ?home for the home screen with made-up boards, ?home=empty, ?home=many)
pnpm test           # model tests
```

The Mac app needs Rust (`rustup`) and the Xcode command line tools.

## Smoothness

The board has to hold 60 fps on a full board, in WebKit (the engine the Mac
app runs on). `pnpm bench` checks that:

```bash
pnpm exec playwright install webkit   # once
pnpm bench
```

It opens a board of 51 images (`scripts/bench/board.json`, with placeholder
pictures it draws into `scripts/bench/media/`) in headless WebKit at 1440x900 @2x,
then pans with the pointer over a card and over empty space, pinch-zooms, and
opens a stack. For each it prints fps, the 95th percentile frame time and the
share of frames over 20ms, and fails if any run averages under 55 fps or has
more than 5% of frames over 20ms. It uses your `pnpm dev` server when one is
running for this checkout, and starts its own otherwise.

## Home

The app opens on Forma's home: every board on this Mac (each folder in
Documents/Forma with a `board.json`, and any opened from elsewhere) as a pile
of its own pictures, the latest first. Click one to go in; the last spot makes
a new board. "All boards" in the project menu comes back here.

## On the board

- **Stacks.** Drag a card onto another card to start a stack; drag cards or
  stacks onto a stack to add to it. Click a stack to open it; click an image to
  lift it; Esc steps back out. Double-click a stack's name to rename it.
- **Connections.** Hover anything to see its ports and pull a wire to anything
  else. Wires always take the sides facing each other. Hover a wire and press +
  (or double-click it) to put a note on it.
- **Keys.** V select, H move around, N note, I image, F fit everything,
  ⌘Z / ⇧⌘Z undo and redo. Two fingers pan, pinch zooms.

## Layout

- `src/model` pure logic (stacking rules, wire geometry, board operations) with tests
- `src/canvas` the board: nodes, wires, drag-to-stack, undo
- `src/focus` an opened stack
- `src/home` the home screen: every board as a pile, and making a new one
- `src/chrome` toolbar and zoom
- `src/styles` design tokens and styles (light theme; dark comes later)
- `src-tauri` the Mac app shell
- `scripts` `pnpm bench`, the frame-rate check, and its fixture board

`public/sample/` holds local sample images and is not committed.

## Licence

AGPL-3.0. See `LICENSE`.

Made by David Pukha, [pukha.world](https://pukha.world).
