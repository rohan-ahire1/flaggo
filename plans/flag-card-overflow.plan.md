# Fix flag cards overflowing their container in the Library grid

## Summary

In the Flags Library grid, cards with long country names (e.g. "Caribbean Netherlands", "Central African Republic") render wider/taller than their neighbors, the flag image spills past the card's right edge, and the name text is not truncated.

Root cause is a single layout defect in `FlagCard`. The card root is a `<button>`, which defaults to `display: inline-block`, so it sizes to its content rather than to its grid cell. The name elements use the Tailwind `truncate` utility (`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`). Because the button is content-sized and nothing establishes a `min-width: 0` constraint, the `nowrap` name forces the button wider than its grid cell. `FlagImage` is `w-full`, so it inherits that excessive width and, via `aspect-[4/3]`, also becomes taller — producing the overflow and the uneven card heights. `truncate` never activates because the button width is unconstrained.

This is one bug surfacing as three symptoms (flag overflow, untruncated text, mismatched heights). Non-rectangular flags (Nepal, etc.) are not part of this bug; `object-contain` already letterboxes them correctly.

## Implementation Changes

### 1. `src/components/FlagCard.tsx`

On the root `<button>` element (currently line 10-13), add `flex w-full min-w-0 flex-col` and `h-full` to the existing className.

- `w-full` makes the button fill its grid cell instead of sizing to content.
- `min-w-0` allows the button (and therefore its `truncate` children) to shrink below the intrinsic content width so ellipsis truncation works.
- `flex flex-col` keeps the existing vertical stacking explicit and predictable once `h-full` is applied.
- `h-full` makes the button fill the (stretched) grid cell so all cards in a row share the same height.

Resulting className (preserve all existing classes, just add the new ones):

```
className="group relative flex h-full w-full min-w-0 flex-col rounded-[22px] border border-flaggo-border bg-white p-3 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
```

No other changes to `FlagCard` are required. The existing `truncate` classes on the name (line 20) and capital (line 21) divs remain and will now function correctly.

### 2. `src/screens/FlagsLibraryScreen.tsx`

On the grid cell wrapper `<div key={country.code} className="relative">` (line 83), add `min-w-0` and `h-full`.

- `min-w-0` propagates the shrink constraint to the wrapper (the grid item), reinforcing correct truncation even though `grid-cols-*` already uses `minmax(0, 1fr)`.
- `h-full` ensures the stretched grid cell passes its full height down to the button so `h-full` on the button resolves to the row height.

Resulting line:

```
<div key={country.code} className="relative h-full min-w-0">
```

No changes to the grid container (`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4`) are needed.

## Test Plan

Manual (primary; this is a CSS/layout fix):

1. Run the app, go to Library → Flags.
2. Confirm long-named cards render correctly:
   - "Caribbean Netherlands" and "Central African Republic" stay within their grid cell; flag image no longer overflows the card's right edge.
   - Their card widths/heights match the adjacent short-named cards in the same row.
   - Long names truncate with an ellipsis instead of forcing the card wider.
3. Confirm short-named cards (Canada, Chad, Chile) are visually unchanged.
4. Confirm non-rectangular flags (search "Nepal") sit centered/letterboxed inside the `4:3` box with no overflow.
5. Check the responsive breakpoints (`sm:grid-cols-3`, `lg:grid-cols-4`) still lay out evenly.
6. Verify the star button (top-right overlay in `FlagsLibraryScreen`) and the mastered star badge in `FlagCard` still position correctly over the card.

No automated tests are added; there is no existing render/snapshot harness for these components and the change is purely presentational.

## Assumptions

- Tailwind config resolves `grid-cols-2` to `repeat(2, minmax(0, 1fr))` (Tailwind v3 default); the fix does not depend on this but is consistent with it.
- Card vertical content order (flag, name, capital, continent/difficulty, progress bar) is unchanged; `flex flex-col` reproduces the current stacking.
- Equal-height cards are desired (implied by the grid layout); if not, `h-full` on both elements can be dropped while keeping `w-full min-w-0`, which alone fixes the overflow and truncation.

## Acceptance Criteria

- No flag card's content (flag image or text) extends beyond its grid cell at any supported breakpoint.
- All cards within the same grid row have equal width and height.
- Country names longer than the card width are truncated with an ellipsis.
- No regression to the star toggle, mastered badge, progress bar, or short-named cards.
