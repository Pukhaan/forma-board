# Contributing to Forma

- **Follow [DESIGN.md](DESIGN.md)** before building anything: the tokens, no
  borders, no colour of its own, icons, motion and copy.
- **Smooth is a requirement.** The board holds 60 fps on a realistic, full
  board, in WebKit. Every new animation or visual effect (and any change to
  how the board draws) must pass `pnpm bench` before it is committed. If your
  change adds a new kind of motion, add a run for it to
  `scripts/bench-pan.mjs`, so it is measured from then on.
- **Measure it.** Slowdowns in WebKit often come from painting: panning over
  a card once fell to 7 fps because the dot layer repainted every image
  underneath it, while our own code took under a millisecond a frame. Only a
  frame-timed run on a full board shows that.
- **Run `pnpm test`** for the model logic.
