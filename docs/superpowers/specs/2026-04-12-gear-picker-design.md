# Gear Picker: Sort, Detail Pane, and Keyboard Navigation

**Issue:** #42  
**Date:** 2026-04-12  
**Status:** Approved

## Overview

Upgrade `GearSlot.vue` (in-place, no new files) to make the gear picker dialog a comparison-friendly tool. The three additions are:

1. **Sort controls** — Name (A→Z) and DMG (high→low) sort pills above the list
2. **Side detail pane** — 220px panel to the right of the list showing all stats for the focused item
3. **Keyboard navigation** — ↑↓ to move focus, Enter to equip, Esc to close

Stat filters and additional sort keys (Store TP, WSD, etc.) are explicitly out of scope for this iteration.

---

## Layout

Dialog widens from 500px to **720px**. The dialog body splits into two columns:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Head — SAM                                                         │
├──────────────────────────────────────┬──────────────────────────────┤
│  [Search…]                           │                              │
│  Sort: [Name] [DMG ↓]               │  Adhemar Bonnet +1           │
│                                      │  Head · All Jobs             │
│  ON  Mekosuchinae Helm   DEX+13 …   │  ─────────────────────       │
│      None                            │  DEX        +15              │
│  ▶   Adhemar Bonnet +1  DEX+15 …   │  AGI        +13              │
│      Turms Cap +1        STP+11 …   │  Attack     +18              │
│      Nyame Helm          WSD+8% …   │  Accuracy   +18              │
│      …                               │  DA         +5%              │
│                                      │  Crit Rate  +3%              │
│                                      │                              │
│                                      │  [Equip]                     │
│  ↑↓ navigate · Enter equip · Esc   │                              │
└──────────────────────────────────────┴──────────────────────────────┘
```

---

## Component changes — `GearSlot.vue`

### New reactive state

```typescript
const sortKey = ref<'name' | 'dmg'>('name')
const focusedIndex = ref<number>(0)   // index into displayList
```

`focusedIndex` drives both the keyboard highlight and the detail pane. It resets to 0 whenever `searchQuery` or `sortKey` changes, and when the dialog opens.

### `displayList` computed

The sorted, filtered list used in the template. The currently equipped item is always pinned as the first entry (after "None"), regardless of sort, with a boolean flag `isPinned` for the "ON" badge.

```typescript
const displayList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  let items = availableItems.value.filter(i =>
    !q || i.Name.toLowerCase().includes(q) || (i.Name2 ?? '').toLowerCase().includes(q)
  )

  if (sortKey.value === 'name') {
    items = [...items].sort((a, b) => a.Name.localeCompare(b.Name))
  } else {
    // dmg: items without DMG sort to the end
    items = [...items].sort((a, b) => (b.DMG ?? -1) - (a.DMG ?? -1))
  }

  return items
})
```

"None" is rendered as a fixed first row before `displayList` (not part of the array), so `focusedIndex` 0 = None, 1 = displayList[0], etc.

### `focusedItem` computed

```typescript
const focusedItem = computed((): GearItem | null => {
  if (focusedIndex.value === 0) return null  // None selected
  return displayList.value[focusedIndex.value - 1] ?? null
})
```

The detail pane renders `focusedItem`. When `focusedItem` is null, the detail pane shows a placeholder ("Select an item to see stats").

### Keyboard handler

Attached to the dialog container via `@keydown` (or the list `<div>`):

```typescript
function onKeyDown(e: KeyboardEvent) {
  const total = displayList.value.length + 1  // +1 for None
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, total - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    confirmFocused()
  }
  // Esc is handled natively by PrimeVue Dialog
}

function confirmFocused() {
  const item = focusedItem.value ?? emptyItem
  pickItem(item)
}
```

### Equipped item pin

The currently equipped item (matching `props.item.Name`) gets an "ON" badge and is rendered at the top of the list (before `displayList`), always visible regardless of search or sort. If the search query filters it out of `displayList`, it still appears pinned.

Concretely: render order in template is:
1. Pinned equipped row (if `props.item.Name !== 'None'`)
2. None row
3. `displayList` rows (with the equipped item visually de-emphasised if it also appears here — or deduplicate by excluding it from `displayList`)

**Implementation choice:** exclude the currently equipped item from `displayList` to avoid duplicates. The pinned row always appears; clicking it re-selects the same item (no-op in practice).

### Detail pane stats

Uses the existing `STAT_DISPLAY` array. Only non-zero stats are shown, displayed as `label / +value` rows. The pane is always visible (220px column); when no item is focused it shows a faint placeholder text.

### Dialog width

Change `:style="{ width: '500px', maxHeight: '80vh' }"` to `:style="{ width: '720px', maxHeight: '80vh' }"`.

The dialog body uses `display: flex` with two children: the list column (`flex: 1`, `min-width: 0`) and the detail column (`width: 220px`, `flex-shrink: 0`).

### Row click vs. equip

Row clicks update `focusedIndex` only — they do **not** call `pickItem`. The existing `@click="pickItem(gi)"` on each row is replaced with `@click="focusedIndex = i + 1"` (where `i` is the index in `displayList`). The None row sets `focusedIndex = 0`.

Equipping happens via two paths:
1. The **Equip** button in the detail pane calls `confirmFocused()`
2. Pressing **Enter** calls `confirmFocused()`

`confirmFocused()` calls `pickItem(focusedItem.value ?? emptyItem)` which emits `select` and closes the dialog.

### Stat summary in list rows

Each list row shows a short stat summary (the existing `formatStats` inline text, but truncated). No change needed to `formatStats` — the list row already renders it. The key improvement is that the full stat detail is now always available in the pane rather than requiring hover.

---

## Styles

Add/update in `<style scoped>`:

```css
/* Dialog body layout */
.gear-picker-body {
  display: flex;
  gap: 0;
  height: 100%;
}

.gear-list-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 4px 4px 0;
  border-right: 1px solid #2e3f6a;
}

.gear-detail-col {
  width: 220px;
  flex-shrink: 0;
  padding: 0 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

/* Sort pills */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-pill {
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid #2e3f6a;
  background: transparent;
  color: #888;
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}

.sort-pill.active {
  border-color: #5580cc;
  background: #1a2a4a;
  color: #a0c4ff;
}

/* Equipped pin badge */
.equipped-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #7acc88;
  background: #1a4020;
  padding: 1px 5px;
  border-radius: 3px;
}

.gear-item-row.equipped-pin {
  background: #1e3a20;
  border: 1px solid #3a6040;
}

/* Keyboard focus highlight */
.gear-item-row.focused {
  background: #1a3660;
  border: 1px solid #5580cc;
  outline: none;
}

/* Keyboard hint */
.keyboard-hint {
  font-size: 0.7rem;
  color: #555;
  border-top: 1px solid #1e2e50;
  padding-top: 6px;
  flex-shrink: 0;
}

/* Detail pane */
.detail-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #a0c4ff;
}

.detail-meta {
  font-size: 0.72rem;
  color: #8899bb;
}

.detail-stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
}

.detail-stat-label {
  color: #8899bb;
}

.detail-stat-value {
  color: #e0e0e0;
}

.detail-placeholder {
  color: #444;
  font-size: 0.75rem;
  font-style: italic;
  margin-top: 16px;
}

.detail-equip-btn {
  margin-top: auto;
  width: 100%;
  padding: 6px;
  background: #1a3660;
  border: 1px solid #5580cc;
  border-radius: 4px;
  color: #a0c4ff;
  font-size: 0.78rem;
  cursor: pointer;
}

.detail-equip-btn:hover {
  background: #223e70;
}
```

---

## Acceptance criteria

- Dialog is 720px wide with the list on the left and the detail pane on the right
- Sort pills "Name" and "DMG" appear above the search box; active pill is visually distinct
- Clicking a sort pill re-sorts the list immediately; `focusedIndex` resets to 0
- Currently equipped item appears pinned at the top (green ON badge), regardless of sort or search
- The equipped item is excluded from the main `displayList` to avoid duplication
- Clicking any list row updates `focusedIndex` and the detail pane only (no immediate equip)
- Pressing Enter or clicking the Equip button in the detail pane equips the focused item and closes the dialog
- Detail pane shows all non-zero stats from `STAT_DISPLAY` for the focused item
- ↑↓ arrow keys move `focusedIndex`; Enter equips; Esc closes (PrimeVue native)
- `focusedIndex` resets to 0 when search query or sort key changes, and when dialog opens
- Keyboard hint line is visible at the bottom of the list column
- Build passes with no TypeScript errors

---

## Out of scope

- Stat filters (has Store TP, has WSD, etc.)
- Additional sort keys (Store TP, WSD, Attack, Accuracy)
- Ascending/descending toggle per key
- Multi-column stat view in the list rows
- Item comparison (current vs candidate delta)
