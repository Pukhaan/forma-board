# The Weft project format

A Weft project is a normal folder. Anything that can edit files (you, a script,
an AI tool) can change the board, and the app shows the change straight away.

```
Northwind/
  board.json     the board
  media/         images used on the board
```

## board.json

```json
{
  "weft": 1,
  "nodes": [
    { "id": "project", "type": "project", "x": -170, "y": -80,
      "title": "Northwind", "brief": "AI shopping assistant for small brands." },

    { "id": "note-founders", "type": "note", "x": -760, "y": -300,
      "text": "Founders call, 20 Oct\n\nThey want it calm and trustworthy." },

    { "id": "stack-blue", "type": "stack", "x": 480, "y": -400,
      "title": "Blue and white",
      "items": [
        { "id": "0bbf2964", "kind": "image", "file": "media/0bbf2964.jpg",
          "w": 300, "h": 300, "title": "Blue triangle" }
      ] },

    { "id": "card-robot", "type": "card", "x": 940, "y": 470,
      "item": { "id": "42cd816b", "kind": "image", "file": "media/42cd816b.jpg", "w": 300, "h": 300 } }
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
| `card` | `item` | A single loose item. |

### Items

| field | |
| --- | --- |
| `id` | unique within the board |
| `kind` | `image` for now (`link` and `note` are reserved) |
| `file` | path inside the project folder, e.g. `media/foo.jpg` |
| `src` | a web URL, only when the item isn't a file in the folder |
| `w`, `h` | natural size in pixels, so the board keeps the proportions |
| `title` | optional caption |

### Wires

`from` and `to` are node ids. `note` is optional text shown on the wire: why
the two things are connected. Direction doesn't matter to the app.

## Editing rules

- Write valid JSON. A broken entry is skipped; a file that isn't JSON is
  ignored until it's fixed.
- To add an image: put the file in `media/` and reference it from a `card` or a
  stack's `items`.
- To sort: move items between stacks' `items` arrays. To connect: add a wire.
- Ids must be unique. Wires to missing nodes are dropped.
- The app saves through a temporary file and a rename, so you never read a
  half-written board. Do the same if you write often.
