# The Forma project format

A Forma project is a normal folder. Anything that can edit files (you, a script,
an AI tool) can change the board, and the app shows the change straight away.

```
Northwind/
  board.json     the board
  media/         images used on the board
  components/    live cards: small coded components, one HTML file each
```

Anything can be stacked: images, notes, links and live cards sit in the same
stacks.

## board.json

```json
{
  "forma": 1,
  "nodes": [
    { "id": "project", "type": "project", "x": -170, "y": -80,
      "title": "Northwind", "brief": "AI shopping assistant for small brands." },

    { "id": "note-founders", "type": "note", "x": -760, "y": -300,
      "text": "Founders call, 20 Oct\n\nThey want it calm and trustworthy." },

    { "id": "stack-blue", "type": "stack", "x": 480, "y": -400,
      "title": "Blue and white",
      "items": [
        { "id": "0bbf2964", "kind": "image", "file": "media/0bbf2964.jpg",
          "w": 300, "h": 300, "title": "Blue triangle" },
        { "id": "note-palette", "kind": "note",
          "text": "Palette\n\nNavy, one light blue, lots of white." },
        { "id": "link-havn", "kind": "link",
          "url": "https://havn.studio/", "title": "HAVN studio" }
      ] },

    { "id": "card-robot", "type": "card", "x": 940, "y": 470,
      "item": { "id": "42cd816b", "kind": "image", "file": "media/42cd816b.jpg", "w": 300, "h": 300 } },

    { "id": "card-arena", "type": "card", "x": 940, "y": 760,
      "item": { "id": "a7c1e0f2", "kind": "link", "url": "https://www.are.na/" } }
  ],
  "wires": [
    { "id": "e3", "from": "note-founders", "to": "stack-blue", "note": "They like blue and white" }
  ]
}
```

### Nodes

Every node has a unique `id`, a `type`, and a position `x`, `y` (board units,
y grows downward). Sizes are not stored, except an area's; the app lays each
other node out itself.

| type | fields | what it is |
| --- | --- | --- |
| `project` | `title`, `brief` | The centre of the board. Usually one. |
| `note` | `text` | Research in words. The first paragraph (before a blank line) is its heading. |
| `stack` | `title`, `items`, `description` | A pile of items under one name. The **last** item is the cover. `description` is optional: one short line shown under the title, saying what the stack is for. |
| `card` | `item` | A single loose image, link or live card. |
| `area` | `title`, `w`, `h` | A soft, named zone that groups things, like "Inspiration" or "Plan". Drawn under everything else. |

A loose note is always a `note` node. When a note node is dropped on a stack
it becomes a `note` item there, and taking it out makes it a `note` node again.
A `card` holding a `note` item is read as a `note` node.

### Areas

```json
{ "id": "area-look", "type": "area", "x": 448, "y": -480, "w": 1088, "h": 768, "title": "Look and feel" }
```

`x`, `y` is the area's top-left corner and `w`, `h` its size, in board units.
Keep all four on the 32-unit grid. **A thing belongs to an area when its centre
is inside the area's rectangle.** Nothing else links them: to put something in
an area, give it a position whose centre falls inside; to take it out, move it
outside. When a thing's centre is inside two areas it belongs to the smaller.
Moving an area in the app moves everything that belongs to it. Areas never
stack and never take wires.

### Items

Every item has a unique `id` (unique within the board) and a `kind`. A missing
`kind` means `image`. What else it needs depends on the kind:

| kind | fields | what it is |
| --- | --- | --- |
| `image` | `file` or `src`, `w`, `h`, `title` | A picture. |
| `note` | `text` | Words, written the same way as a `note` node's `text`. |
| `link` | `url`, `title` | A web page. Without a `title` the app shows the site's name. |
| `live` | `file` or `src`, `w`, `h`, `title` | A small coded component (an interaction prototype) that runs on the board. See [Live cards](#live-cards). |

| field | |
| --- | --- |
| `file` | image: path inside the project folder, e.g. `media/foo.jpg`; live: e.g. `components/stack-fan.html` |
| `src` | image or live: a web URL, only when the item isn't a file in the folder |
| `w`, `h` | image: natural size in pixels, so the board keeps the proportions; live: the shape it is drawn at (4:3 when missing) |
| `text` | note: the text. The first paragraph (before a blank line) is its heading |
| `url` | link: the full address, starting with `https://` or `http://` |
| `title` | optional: an image's caption, a link's name, or a live card's name |

```json
{ "id": "n1", "kind": "note", "text": "Who buys\n\nSmall brand owners, 28 to 40." }
{ "id": "l1", "kind": "link", "url": "https://linear.app/method", "title": "Linear Method" }
```

An item missing what its kind needs (a link with no `url`, a live card with
neither `file` nor `src`), or with a kind the app doesn't know, is skipped.

### Live cards

A live card runs a small, self-contained component right next to the research
it came from, to show how something moves or responds.

```json
{ "id": "card-fan", "type": "card", "x": 960, "y": 64,
  "item": { "id": "live-fan", "kind": "live", "file": "components/stack-fan.html",
            "title": "Stack fan", "w": 640, "h": 400 } }
```

- A component is **one HTML file** under `components/`, with its styles and
  scripts inside it. It may load scripts from a CDN (a `<script src>` from
  unpkg, jsDelivr and the like); everything else should be in the file.
- It runs **sandboxed**: scripts only, with no access to the app, the project
  folder, the file system or the page around it. No popups, forms or
  navigation of the window.
- It should **size itself to its viewport** (`vw`, `vh`, `vmin`, percentages),
  since it is shown about 320 board units wide on the board and much bigger
  when opened. `w`, `h` only set the shape it is drawn at.
- On the board it only runs while it is on screen and zoomed in far enough to
  read, and at most four run at once. It takes no pointer there, so it drags
  like any card; open it (double-click, or its Open pill) to play with it.

### Wires

`from` and `to` are node ids. `note` is optional text shown on the wire: why
the two things are connected. Direction doesn't matter to the app.

## Editing rules

- Write valid JSON. A broken entry is skipped; a file that isn't JSON is
  ignored until it's fixed.
- To add an image: put the file in `media/` and reference it from a `card` or a
  stack's `items`.
- To add a link: a `card` whose `item` is a `link`, or a `link` item in a
  stack's `items`.
- To add a live card: put its HTML file in `components/` and reference it
  from a `card` or a stack's `items`, like an image. To add a note to a stack: a `note` item in its `items`.
- To sort: move items between stacks' `items` arrays. To connect: add a wire.
- Ids must be unique. Wires to missing nodes are dropped.
- The app saves through a temporary file and a rename, so you never read a
  half-written board. Do the same if you write often.
