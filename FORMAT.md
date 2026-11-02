# The Forma project format

A Forma project is a normal folder. Anything that can edit files (you, a script,
an AI tool) can change the board, and the app shows the change straight away.

```
Northwind/
  board.json     the board
  media/         images used on the board
```

Anything can be stacked: images, notes and links sit in the same stacks.

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
y grows downward). Sizes are not stored; the app lays each node out itself.

| type | fields | what it is |
| --- | --- | --- |
| `project` | `title`, `brief` | The centre of the board. Usually one. |
| `note` | `text` | Research in words. The first paragraph (before a blank line) is its heading. |
| `stack` | `title`, `items` | A pile of items under one name. The **last** item is the cover. |
| `card` | `item` | A single loose image or link. |

A loose note is always a `note` node. When a note node is dropped on a stack
it becomes a `note` item there, and taking it out makes it a `note` node again.
A `card` holding a `note` item is read as a `note` node.

### Items

Every item has a unique `id` (unique within the board) and a `kind`. A missing
`kind` means `image`. What else it needs depends on the kind:

| kind | fields | what it is |
| --- | --- | --- |
| `image` | `file` or `src`, `w`, `h`, `title` | A picture. |
| `note` | `text` | Words, written the same way as a `note` node's `text`. |
| `link` | `url`, `title` | A web page. Without a `title` the app shows the site's name. |

| field | |
| --- | --- |
| `file` | image: path inside the project folder, e.g. `media/foo.jpg` |
| `src` | image: a web URL, only when the item isn't a file in the folder |
| `w`, `h` | image: natural size in pixels, so the board keeps the proportions |
| `text` | note: the text. The first paragraph (before a blank line) is its heading |
| `url` | link: the full address, starting with `https://` or `http://` |
| `title` | optional: an image's caption, or a link's name |

```json
{ "id": "n1", "kind": "note", "text": "Who buys\n\nSmall brand owners, 28 to 40." }
{ "id": "l1", "kind": "link", "url": "https://linear.app/method", "title": "Linear Method" }
```

An item missing what its kind needs (a link with no `url`), or with a kind the
app doesn't know, is skipped.

### Wires

`from` and `to` are node ids. `note` is optional text shown on the wire: why
the two things are connected. Direction doesn't matter to the app.

## Editing rules

- Write valid JSON. A broken entry is skipped; a file that isn't JSON is
  ignored until it's fixed.
- To add an image: put the file in `media/` and reference it from a `card` or a
  stack's `items`.
- To add a link: a `card` whose `item` is a `link`, or a `link` item in a
  stack's `items`. To add a note to a stack: a `note` item in its `items`.
- To sort: move items between stacks' `items` arrays. To connect: add a wire.
- Ids must be unique. Wires to missing nodes are dropped.
- The app saves through a temporary file and a rename, so you never read a
  half-written board. Do the same if you write often.
