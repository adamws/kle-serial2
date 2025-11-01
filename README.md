# kle-serial

[![CI](https://github.com/adamws/kle-serial2/actions/workflows/ci.yml/badge.svg)](https://github.com/adamws/kle-serial2/actions/workflows/ci.yml)
[![GitHub](https://img.shields.io/github/license/adamws/kle-serial2.svg)](LICENSE)

This is a [MIT-licensed](LICENSE) javascript library for parsing the serialized
format used on keyboard-layout-editor.com (KLE) and converting it into something
that is easier to understand and use in third-party applications.

KLE is frequently used to prototype and generate a rough keyboard layout, that
is then used by other applications to create plates, circuit boards, etc. These
third-party applications currently use their own parsing logic.

Unfortunately, the KLE format was designed to be _compact_ (due to some original
limitations), and the format has evolved considerably from its original
versions. As a result, third-party parsing implementations aren't always 100%
compatible with KLE itself, particularly with respect to certain corner-cases or
older / deprecated properties.

This library is the same code that KLE itself uses to parse serialized layouts,
so by using it, you can be sure that you are 100% compatible with the editor.

## Installation

Install the package via NPM:

```bash
npm install git+https://github.com/adamws/kle-serial2.git --save
```

## Usage

```js
var kle = require("@adamws/kle-serial");

var keyboard = kle.Serial.deserialize([
  { name: "Sample", author: "Your Name" },
  ["Q", "W", "E", "R", "T", "Y"]
]);

// or from JSON string

var keyboard = kle.Serial.deserialize(JSON.parse(`[
  { "name": "Sample", "author": "Your Name" },
  ["Q", "W", "E", "R", "T", "Y"]
]`));
```

## API

```ts
kle.Serial.deserialize(rows: Array<any>): Keyboard
```

- Given an array of keyboard rows, deserializes the result into a `Keyboard`
  object.
- The first entry is optionally a keyboard metadata object.

```ts
kle.Serial.serialize(kbd: Keyboard): Array<any>
```

- Given a `Keyboard` object, serializes it back into the KLE array format.
- Returns an array that can be serialized to JSON and imported back into KLE.

### Keyboard Objects

```ts
class Keyboard {
  meta: KeyboardMetadata;
  keys: Key[];
}
```

A `Keyboard` is an object containg keyboard metadata (`meta`) and an array of
`keys`.

### Keyboard Metadata

The `meta` object contains several fields:

```ts
class KeyboardMetadata {
  author: string;
  backcolor: string;
  background: { name: string; style: string } | null;
  name: string;
  notes: string;
  radii: string;
  switchBrand: string;
  switchMount: string;
  switchType: string;
}
```

- `author` — the name of the author
- `backcolor` — the background color of the keyboard editor area (default
  `#eeeeee`)
- `background` (optional) — a background image that overrides `backcolor` if
  specified.
  - The `name` identifies it from the list of backgrounds in the editor; other
    consumers can ignore this property.
  - The `style` is some custom CSS that will override the background color; it
    will have the form: `background-image: url(...)`
- `name` — the name of the keyboard layout
  - Appears in the editor, below the keyboard.
  - Identifies the keyboard among your saved layouts.
  - Used to generate a filename when downloading or rendering the keyboard.
- `notes` — notes about the keyboard layout, in
  [GitHub-flavored Markdown](https://github.github.com/gfm/).
- `radii` — the radii of the keyboard corners, in
  [CSS `border-radius` format](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius),
  e.g., `20px`.
- `switchBrand`, `switchMount`, `switchType` — the _default_ switch `mount`,
  `brand`, and `type` of switches on your keyboard.
  - Default can be overridden on individual keys.
  - See known values here:
    https://github.com/ijprest/keyboard-layout-editor/blob/master/switches.json

### Keys

Each key in the `keys` array contains the following data:

```ts
export class Key {
  color: string;
  labels: string[];
  textColor: Array<string | undefined>;
  textSize: Array<number | undefined>;
  default: { textColor: string; textSize: number };

  x: number;
  y: number;
  width: number;
  height: number;

  x2: number;
  y2: number;
  width2: number;
  height2: number;

  rotation_x: number;
  rotation_y: number;
  rotation_angle: number;

  decal: boolean;
  ghost: boolean;
  stepped: boolean;
  nub: boolean;

  profile: string;

  sm: string; // switch mount
  sb: string; // switch brand
  st: string; // switch type
}
```

- `color` — the keycap color, e.g., `"#ff0000"` for red.
- `labels` — an array of up to 12 text labels (sometimes referred to as
  'legends'):
  - In reading order, i.e., left-to-right, top-to-bottom:
    - ![label order illustration](images/label-order.png)
  - The labels are user input, and may contain arbitrary HTML content; when
    rendering, input sanitization is recommended for security purposes.
- `textColor` — an array of up to 12 colors (e.g., `"#ff0000"`), to be used for
  the text labels; if any entries are `null` or `undefined`, you should use the
  `default.textColor`.
- `textSize` — an array of up to 12 sizes (integers 1-9), to be used for the
  text labels; if any entries are `null` or `undefined`, you should use the
  `default.textSize`.
  - Note that the sizes are relative and do not correspond to any fixed font
    size.
  - KLE uses the following formula when rendering on-screen:
    - (6px + 2px \* _textSize_)
- `default.textColor` / `default.textSize` — the default text color / size.
- `x` / `y` — the absolute position of the key in keyboard units (where _1u_ is
  the size of a standard 1x1 keycap).
- `width` / `height` — the size of the key, in keyboard units.
- `x2` / `y2` / `width2` / `height2` — the size & position of the _second_
  rectangle that is used to define oddly-shaped keys (like an
  [ISO Enter or Big-ass Enter key](https://deskthority.net/wiki/Return_key) or
  [stepped keys](https://deskthority.net/wiki/Keycap#Stepped_keycaps)).
  - If the size is (0,0), then there is no second rectangle required.
  - The position is relative to (`x`, `y`).
  - The two rectangles can be thought of as overlapping, combining to create the
    desired key shape.
    - Note that labels are always positioned relative to the main rectangle.
    - If a key is `stepped`, the second rectangle is the lower part.
    - ![oddly-shapped key illustration](images/oddly-shaped.png)
    - In this example, the second rectangle is shown on top of the original
      rectangle, and (`x2`,`y2`) [`width` x `height`] = (-0.75, 1.0) [2.25 x
      1.0].
- `rotation_x` / `rotation_y` — defines the center of rotation for the key.
- `rotation_angle` — specifies the angle the key is rotated (about the center of
  rotation).
- `decal` — specifies that the key is a 'decal', meaning that only the text
  labels should be rendered, not the keycap borders.
- `ghost` — specifies that key key is 'ghosted', meaning that it is to be
  rendered unobtrusively; typically semi-transparent and without any labels.
- `stepped` — specifies that the key is
  [stepped](https://deskthority.net/wiki/Keycap#Stepped_keycaps).
- `nub` — specifies that the key has a homing nub / bump / dish; the exact
  rendering will depend on the key's `profile`.
- `profile` — specifies the key's "profile" (and row, for those profiles that
  vary depending on the row), e.g., "`DCS R1`" or "`DSA`".
  - Currently supported / known profiles: `SA`, `DSA`, `DCS`, `OEM`, `CHICKLET`,
    `FLAT`
  - Currently supported / known rows: `R1`, `R2`, `R3`, `R4`, `R5`, `SPACE`
- `sm` / `sb` / `st` — the switch _mount_, _brand_, and _type_, overriding the
  default values specified in the keyboard metadata.

## Text Color Format Changes (v0.18+)

Starting with version 0.18, the serialization format for text colors has been updated to be consistent with text sizes, making the format cleaner and less ambiguous.

### New Format

- **`t`** — Default text color (single value)
  - Example: `{t: "#ff0000"}`
  - Sets the default color for all labels on subsequent keys
  - Similar to how `f` sets the default text size

- **`ta`** — Per-label text colors (newline-delimited string)
  - Example: `{ta: "\n#00ff00\n\n#0000ff"}`
  - Overrides the default color for specific label positions
  - Empty positions (empty strings between newlines) use the default color
  - Similar to how `fa` sets per-label text sizes

**Example**

```javascript
// Old format (still supported for reading):
[{t: "#ff0000\n#00ff00"}, "A\nB"]

// New format (used for writing):
[{t: "#ff0000", ta: "\n#00ff00"}, "A\nB"]
```

In the new format:
- `t: "#ff0000"` sets the default color to red
- `ta: "\n#00ff00"` sets position 1 (B) to green
- Position 0 (A) uses the default red color

### Backward Compatibility

**Reading:** The library fully supports the legacy format where `t` contained both the default and per-label colors in a single newline-delimited string. When deserializing:
- If the first value is non-empty, the most common color in the string becomes the default
- If the first value is empty, the default color is not changed

**Writing:** All serialization now uses the new `t`/`ta` format. This provides:
- Consistent semantics with text size (`f`/`fa`)
- Clear separation between default and per-label colors
- Easier to understand and maintain

**Impact on Legacy Readers:** Older implementations reading layouts serialized with the new format will:
- Correctly read the `t` property (default color)
- Ignore the `ta` property (lose per-label color details)

This is an acceptable trade-off for a cleaner, more maintainable format.

## Future Work

In rough order of priority:

1. This library is _based_ on the original KLE code, but it has been converted
   to a TypeScript and modularized to make it convenient for others to consume;
   the KLE site itself is not yet using this actual code.
   - So the first order of business is to update KLE to use this exact NPM
     module.
   - That will ensure that the code is correct, and that nothing has been
     missed, as well as guarantee that the two projects are kept in sync.
2. ~~This library currently only handles _deserialization_; the serialization code
   still needs to be ported.~~ Both serialization and deserialization are now implemented.
3. ~~More tests (particularly on the serialization side, once it's ported; it's
   much more error-prone than deserialization).~~ Comprehensive test coverage has been added for both serialization and deserialization.
4. Migrate some of the supporting data from KLE to this project, so you don't
   have to look it up elsewhere, e.g.:
   - Switch mount / brand / type definitions.
   - Color palettes.
5. Migrate HTML key rendering templates (and supporting stylesheets) from KLE to
   this project, so anyone can render a key identically to KLE.

## Tests

```bash
npm test
```
