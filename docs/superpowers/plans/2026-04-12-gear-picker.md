# Gear Picker Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the gear picker dialog in `GearSlot.vue` with sort controls (Name / DMG), a side detail pane showing full item stats, and keyboard navigation (↑↓ / Enter / Esc).

**Architecture:** All changes are in-place within `wsdist-web/src/components/shared/GearSlot.vue`. New reactive state (`sortKey`, `focusedIndex`) drives a refactored `displayList` computed. The dialog body splits into two flex columns: list (left) and detail pane (right). Row clicks set focus without equipping; Enter or the Equip button confirms the selection.

**Tech Stack:** Vue 3 (`<script setup>`), TypeScript, PrimeVue 4 Dialog, scoped CSS

---

## File Map

| Action | File |
|--------|------|
| Modify | `wsdist-web/src/components/shared/GearSlot.vue` |

---

## Task 1: Sort controls + `displayList` computed + wider dialog

**Files:**
- Modify: `wsdist-web/src/components/shared/GearSlot.vue`

Context: the current file has a `filteredItems` computed (name search only) and a dialog at 500px wide. This task replaces `filteredItems` with `displayList` (search + sort, equipped item excluded), widens the dialog to 720px, and adds Name/DMG sort pills above the search box.

- [ ] **Step 1.1: Add `sortKey` ref and replace `filteredItems` with `displayList`**

In the `<script setup>` block, find:

```typescript
const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return availableItems.value
  return availableItems.value.filter(i =>
    i.Name.toLowerCase().includes(q) || (i.Name2 && i.Name2.toLowerCase().includes(q))
  )
})
```

Replace with:

```typescript
const sortKey = ref<'name' | 'dmg'>('name')

const displayList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const equippedName = props.item.Name

  let items = availableItems.value.filter(i => {
    if (i.Name === equippedName) return false  // exclude equipped; shown as pinned row
    if (!q) return true
    return i.Name.toLowerCase().includes(q) || (i.Name2 ?? '').toLowerCase().includes(q)
  })

  if (sortKey.value === 'name') {
    items = [...items].sort((a, b) => a.Name.localeCompare(b.Name))
  } else {
    // dmg high→low; items without DMG sort to the end
    items = [...items].sort((a, b) => (b.DMG ?? -1) - (a.DMG ?? -1))
  }

  return items
})
```

- [ ] **Step 1.2: Update the template — widen dialog and add sort pills**

Find the `<Dialog` opening tag:

```html
    <Dialog
      v-model:visible="dialogVisible"
      :header="`${label ?? slotName} — ${jobCode.toUpperCase()}`"
      modal
      :style="{ width: '500px', maxHeight: '80vh' }"
      class="gear-dialog"
    >
```

Replace with:

```html
    <Dialog
      v-model:visible="dialogVisible"
      :header="`${label ?? slotName} — ${jobCode.toUpperCase()}`"
      modal
      :style="{ width: '720px', maxHeight: '80vh' }"
      class="gear-dialog"
    >
```

- [ ] **Step 1.3: Add sort pills above the search box in the template**

Find:

```html
      <InputText
        v-model="searchQuery"
        placeholder="Search items..."
        class="gear-search"
        autofocus
      />
```

Replace with:

```html
      <div class="sort-bar">
        <span class="sort-bar-label">Sort:</span>
        <button
          class="sort-pill"
          :class="{ active: sortKey === 'name' }"
          @click="sortKey = 'name'"
        >Name</button>
        <button
          class="sort-pill"
          :class="{ active: sortKey === 'dmg' }"
          @click="sortKey = 'dmg'"
        >DMG</button>
      </div>
      <InputText
        v-model="searchQuery"
        placeholder="Search items..."
        class="gear-search"
        autofocus
      />
```

- [ ] **Step 1.4: Update the item list to use `displayList`**

Find:

```html
        <button
          v-for="gi in filteredItems"
          :key="gi.Name2 ?? gi.Name"
```

Replace with:

```html
        <button
          v-for="(gi, i) in displayList"
          :key="gi.Name2 ?? gi.Name"
```

- [ ] **Step 1.5: Add sort-related styles**

In the `<style scoped>` block, add before the closing `</style>`:

```css
.sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.sort-bar-label {
  font-size: 0.72rem;
  color: #8899bb;
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
```

- [ ] **Step 1.6: Verify build passes**

```bash
cd /srv/ffc/wsdist-web && npm run build
```

Expected: no TypeScript errors, 335+ modules transformed.

- [ ] **Step 1.7: Commit**

```bash
cd /srv/ffc
git checkout -b feat/gear-picker
git add wsdist-web/src/components/shared/GearSlot.vue
git commit -m "feat: add sort controls and displayList to gear picker"
```

---

## Task 2: Equipped item pin + `focusedIndex` + row-click-to-focus

**Files:**
- Modify: `wsdist-web/src/components/shared/GearSlot.vue`

Context: rows currently call `@click="pickItem(gi)"` (equip on click). This task changes that so clicking sets `focusedIndex` only. A pinned "ON" row for the equipped item is inserted before the None row. `focusedIndex` is added and reset on dialog open / search change / sort change.

- [ ] **Step 2.1: Add `focusedIndex` ref and watchers**

In the `<script setup>` block, add after the `sortKey` ref:

```typescript
const focusedIndex = ref(0)  // 0 = None; 1+ = displayList[focusedIndex - 1]
```

Add watchers that reset `focusedIndex` when the list changes:

```typescript
watch([searchQuery, sortKey], () => { focusedIndex.value = 0 })
watch(dialogVisible, (open) => { if (open) focusedIndex.value = 0 })
```

Add `watch` to the existing Vue import at the top of the script:

```typescript
import { ref, computed, watch } from 'vue'
```

- [ ] **Step 2.2: Change row clicks from equip to focus**

Find the row button inside `v-for`:

```html
          @click="pickItem(gi)"
```

Replace with:

```html
          @click="focusedIndex = i + 1"
          :class="{ selected: gi.Name === item.Name, focused: focusedIndex === i + 1 }"
```

(The existing `:class="{ selected: gi.Name === item.Name }"` is replaced entirely by the above.)

Also update the None row to set focus:

Find:

```html
        <button class="gear-item-row" @click="pickItem(emptyItem)">
          <span class="gear-item-name">None</span>
        </button>
```

Replace with:

```html
        <button
          class="gear-item-row"
          :class="{ focused: focusedIndex === 0 }"
          @click="focusedIndex = 0"
        >
          <span class="gear-item-name">None</span>
        </button>
```

- [ ] **Step 2.3: Add the equipped pin row above the None row**

Find the gear-item-list opening and the None row together:

```html
      <div class="gear-item-list">
        <button class="gear-item-row" @click="focusedIndex = 0"
```

Insert the pin row between the list opening and the None row:

```html
      <div class="gear-item-list">
        <!-- Pinned equipped row (only shown if something is equipped) -->
        <button
          v-if="item.Name !== 'None'"
          class="gear-item-row equipped-pin"
          @click="pickItem(item)"
          :title="formatStats(item)"
        >
          <span class="equipped-badge">ON</span>
          <img
            v-if="iconUrl"
            :src="iconUrl"
            class="gear-icon-sm"
            loading="lazy"
          />
          <span class="gear-item-name">{{ item.Name }}</span>
          <span class="gear-item-stats">{{ formatStats(item).replace(/\n/g, '  ') }}</span>
        </button>
        <button
          class="gear-item-row"
          :class="{ focused: focusedIndex === 0 }"
          @click="focusedIndex = 0"
```

- [ ] **Step 2.4: Add pin and focus styles**

Add in `<style scoped>`:

```css
.gear-item-row.equipped-pin {
  background: #1e3a20;
  border: 1px solid #3a6040;
  border-radius: 3px;
}

.gear-item-row.focused {
  background: #1a3660;
  border: 1px solid #5580cc;
  outline: none;
}

.equipped-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #7acc88;
  background: #1a4020;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}
```

- [ ] **Step 2.5: Verify build passes**

```bash
cd /srv/ffc/wsdist-web && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 2.6: Commit**

```bash
cd /srv/ffc
git add wsdist-web/src/components/shared/GearSlot.vue
git commit -m "feat: add equipped pin row and focusedIndex to gear picker"
```

---

## Task 3: Side detail pane

**Files:**
- Modify: `wsdist-web/src/components/shared/GearSlot.vue`

Context: adds a 220px right column to the dialog body showing all non-zero stats for the focused item. The dialog body becomes a flex row; the existing search/sort/list content moves into the left column.

- [ ] **Step 3.1: Add `focusedItem` computed**

In the `<script setup>` block, add after `focusedIndex`:

```typescript
const focusedItem = computed((): GearItem | null => {
  if (focusedIndex.value === 0) return null
  return displayList.value[focusedIndex.value - 1] ?? null
})

function detailStats(item: GearItem): { label: string; value: string }[] {
  return STAT_DISPLAY
    .filter(stat => item[stat] !== undefined && item[stat] !== 0)
    .map(stat => {
      const val = item[stat]
      const formatted = typeof val === 'number' && val > 0 ? `+${val}` : String(val)
      return { label: stat, value: formatted }
    })
}
```

- [ ] **Step 3.2: Wrap dialog content in a two-column flex layout**

The current dialog content (after `<Dialog ...>`) looks like:

```html
    <Dialog ...>
      <div class="sort-bar">
        ...
      </div>
      <InputText ... />
      <div class="gear-item-list">
        ...
      </div>
    </Dialog>
```

Wrap everything in a `.gear-picker-body` div, put the existing content in `.gear-list-col`, and add `.gear-detail-col` as the second column:

```html
    <Dialog ...>
      <div class="gear-picker-body">

        <!-- Left: search + sort + list -->
        <div class="gear-list-col">
          <div class="sort-bar">
            ...
          </div>
          <InputText ... />
          <div class="gear-item-list">
            ...
          </div>
        </div>

        <!-- Right: detail pane -->
        <div class="gear-detail-col">
          <template v-if="focusedItem">
            <div class="detail-name">{{ focusedItem.Name }}</div>
            <div class="detail-meta">{{ focusedItem.Type ?? 'Equipment' }}</div>
            <div class="detail-stats-list">
              <div
                v-for="s in detailStats(focusedItem)"
                :key="s.label"
                class="detail-stat-row"
              >
                <span class="detail-stat-label">{{ s.label }}</span>
                <span class="detail-stat-value">{{ s.value }}</span>
              </div>
            </div>
          </template>
          <div v-else class="detail-placeholder">
            Select an item to see stats
          </div>
        </div>

      </div>
    </Dialog>
```

- [ ] **Step 3.3: Add layout and detail pane styles**

Add in `<style scoped>`:

```css
/* Two-column dialog body */
.gear-picker-body {
  display: flex;
  gap: 0;
  min-height: 400px;
}

.gear-list-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 12px;
  border-right: 1px solid #2e3f6a;
}

.gear-detail-col {
  width: 220px;
  flex-shrink: 0;
  padding-left: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

/* Detail pane content */
.detail-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #a0c4ff;
  word-break: break-word;
}

.detail-meta {
  font-size: 0.72rem;
  color: #8899bb;
  margin-bottom: 4px;
}

.detail-stats-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid #2e3f6a;
  padding-top: 6px;
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
  font-family: 'Courier New', monospace;
}

.detail-placeholder {
  color: #444;
  font-size: 0.75rem;
  font-style: italic;
  margin-top: 16px;
}
```

- [ ] **Step 3.4: Update `.gear-item-list` max-height to fit the new layout**

The existing rule is:

```css
.gear-item-list {
  max-height: 60vh;
  overflow-y: auto;
  ...
}
```

Change `max-height: 60vh` to `max-height: 50vh` so the list fits inside the taller layout without overflowing the dialog.

- [ ] **Step 3.5: Verify build passes**

```bash
cd /srv/ffc/wsdist-web && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3.6: Commit**

```bash
cd /srv/ffc
git add wsdist-web/src/components/shared/GearSlot.vue
git commit -m "feat: add side detail pane to gear picker"
```

---

## Task 4: Keyboard navigation + Equip button + keyboard hint

**Files:**
- Modify: `wsdist-web/src/components/shared/GearSlot.vue`

Context: adds ↑↓ / Enter keyboard navigation, a keyboard hint line at the bottom of the list column, and an Equip button in the detail pane. Also imports `Button` from PrimeVue for the Equip button.

- [ ] **Step 4.1: Import Button from PrimeVue**

Add to the import block at the top of `<script setup>`:

```typescript
import Button from 'primevue/button'
```

- [ ] **Step 4.2: Add `onKeyDown` and `confirmFocused` functions**

Add at the end of `<script setup>` (before `</script>`):

```typescript
function confirmFocused() {
  const item = focusedItem.value ?? emptyItem
  pickItem(item)
}

function onKeyDown(e: KeyboardEvent) {
  const total = displayList.value.length + 1  // +1 for None row
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
}
```

- [ ] **Step 4.3: Attach keyboard handler and add hint + Equip button to template**

Find the `.gear-list-col` div. Add `@keydown="onKeyDown"` to it and add the keyboard hint line at the bottom:

```html
        <div class="gear-list-col" @keydown="onKeyDown">
          ...  <!-- existing sort bar, InputText, gear-item-list unchanged -->
          <div class="keyboard-hint">↑↓ navigate &nbsp;·&nbsp; Enter equip &nbsp;·&nbsp; Esc close</div>
        </div>
```

In the `.gear-detail-col`, add the Equip button after the stats list (inside `<template v-if="focusedItem">`):

```html
          <template v-if="focusedItem">
            <div class="detail-name">{{ focusedItem.Name }}</div>
            <div class="detail-meta">{{ focusedItem.Type ?? 'Equipment' }}</div>
            <div class="detail-stats-list">
              <div
                v-for="s in detailStats(focusedItem)"
                :key="s.label"
                class="detail-stat-row"
              >
                <span class="detail-stat-label">{{ s.label }}</span>
                <span class="detail-stat-value">{{ s.value }}</span>
              </div>
            </div>
            <Button
              label="Equip"
              size="small"
              severity="secondary"
              class="detail-equip-btn"
              @click="confirmFocused"
            />
          </template>
```

- [ ] **Step 4.4: Add keyboard hint and Equip button styles**

Add in `<style scoped>`:

```css
.keyboard-hint {
  font-size: 0.7rem;
  color: #555;
  border-top: 1px solid #1e2e50;
  padding-top: 6px;
  flex-shrink: 0;
}

.detail-equip-btn {
  margin-top: auto;
  width: 100%;
}
```

- [ ] **Step 4.5: Verify build passes**

```bash
cd /srv/ffc/wsdist-web && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4.6: Commit**

```bash
cd /srv/ffc
git add wsdist-web/src/components/shared/GearSlot.vue
git commit -m "feat: add keyboard navigation and Equip button to gear picker (#42)"
```

---

## Task 5: Open PR

- [ ] **Step 5.1: Push branch and open PR**

```bash
cd /srv/ffc
git push -u origin feat/gear-picker
gh pr create \
  --title "feat: improved gear picker — sort, detail pane, keyboard nav (#42)" \
  --body "$(cat <<'EOF'
## Summary

- Widens the gear picker dialog to 720px and adds a 220px detail pane to the right showing all non-zero stats for the focused item
- Adds Name / DMG sort pills above the search box; active pill is highlighted; sort resets focus to None
- Currently equipped item is pinned at the top of the list with a green ON badge, regardless of sort or search; it is excluded from the main sorted list to avoid duplication
- Row clicks now set focus (updates detail pane) without immediately equipping; confirmed via Enter key or Equip button in detail pane
- ↑↓ arrow keys navigate the list; keyboard hint shown at the bottom of the list column

Closes #42

## Test plan

- [ ] Open a gear slot picker — dialog is wider, detail pane visible on the right
- [ ] Currently equipped item appears at top with ON badge; click it to re-equip
- [ ] Click Name / DMG sort pills — list re-sorts, focus resets to None, detail pane clears
- [ ] Type in search box — list filters, sort is preserved
- [ ] Click any item row — detail pane updates with full stats, item is NOT equipped yet
- [ ] Click Equip button in detail pane — item is equipped, dialog closes
- [ ] Press ↑↓ to navigate — focus ring moves, detail pane updates
- [ ] Press Enter — focused item is equipped, dialog closes
- [ ] Press Esc — dialog closes without equipping
- [ ] None row: click → detail pane clears; Enter → equips None
- [ ] `npm run build` passes with no type errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- Dialog widens to 720px ✓ Task 1
- Sort pills Name / DMG ✓ Task 1
- `displayList` computed (search + sort + equipped excluded) ✓ Task 1
- `focusedIndex` ref + reset on open/search/sort ✓ Task 2
- Equipped item pin with ON badge ✓ Task 2
- Row click sets focus only (no immediate equip) ✓ Task 2
- `focusedItem` computed ✓ Task 3
- `detailStats` helper ✓ Task 3
- Two-column layout (list col + detail col) ✓ Task 3
- Detail pane: name, type, all non-zero stats ✓ Task 3
- `onKeyDown`: ↑↓ moves focus, Enter confirms ✓ Task 4
- `confirmFocused` calls `pickItem` ✓ Task 4
- Equip button in detail pane ✓ Task 4
- Keyboard hint line ✓ Task 4

**Type consistency:**
- `sortKey: ref<'name' | 'dmg'>` — used consistently in `displayList` and sort pill `:class`
- `focusedIndex: ref(0)` — used in `focusedItem`, `onKeyDown`, row `:class`
- `focusedItem: computed(): GearItem | null` — used in detail pane `v-if` and `confirmFocused`
- `detailStats(item: GearItem): { label: string; value: string }[]` — used in `v-for` in detail pane
- `confirmFocused()` — called from Equip button `@click` and `onKeyDown` Enter branch
- `pickItem(item)` — unchanged, called from `confirmFocused` and equipped pin click

**No placeholders found.**
