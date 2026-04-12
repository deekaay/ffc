# Item Sets: Save, Share, and Load Gearsets

**Issues:** #31, #32, #33  
**Date:** 2026-04-12  
**Status:** Approved

## Overview

Three tightly coupled changes that let users save individual gearsets from the Results tab and load them back via a dedicated Item Sets tab. The flow is:

1. Save a gearset from Results → receive a `#set/<key>` URL  
2. Share that URL → recipient lands on the Item Sets tab with the set pre-loaded  
3. Inspect or edit the loaded set locally, then apply it to any of the four calculator slots

---

## #31 — Per-set save buttons in `ResultsTab`

**File:** `wsdist-web/src/components/tabs/ResultsTab.vue`

### What changes

Each of the 4 `.set-panel-header` divs gains a small icon-only save button (PrimeVue `Button`, `icon="pi pi-save"`, `size="small"`, `text`, `severity="secondary"`) beside the existing label text.

The four buttons map to:
- TP Set 1 → `charStore.tpGearset`
- WS Set 1 → `charStore.wsGearset`
- TP Set 2 → `charStore.tpGearset2`
- WS Set 2 → `charStore.wsGearset2`

### State (added to script)

```typescript
import { saveEquipmentSet } from '@/composables/useEquipmentSetApi'
import type { Gearset } from '@/types/gear'

const setShareUrl = ref('')
const setShareVisible = ref(false)
const setSaving = ref(false)   // shared across all 4 buttons
const setError = ref('')
const setCopied = ref(false)
```

### Logic

```typescript
async function onSaveGearset(gearset: Gearset) {
  setSaving.value = true
  setError.value = ''
  try {
    const key = await saveEquipmentSet(gearset)
    setShareUrl.value = `${window.location.origin}${window.location.pathname}#set/${key}`
    setShareVisible.value = true
  } catch (e) {
    setError.value = e instanceof Error ? e.message : 'Save failed'
  } finally {
    setSaving.value = false
  }
}

async function copySetUrl() {
  try {
    await navigator.clipboard.writeText(setShareUrl.value)
    setCopied.value = true
    setTimeout(() => { setCopied.value = false }, 1500)
  } catch {
    setError.value = 'Clipboard write failed — copy the URL manually.'
  }
}
```

### Template additions

- A `<Dialog modal header="Share This Item Set" :style="{ width: '420px' }">` at the bottom of the template showing the share URL and a Copy / Copied! button.
- An inline `<span v-if="setError" class="set-error">` for API/clipboard errors.
- Styles `.share-url-row`, `.share-url-text`, `.set-error` modelled on the identical patterns in `App.vue`.

### Acceptance criteria

- All 4 set headers have a save icon button
- Clicking save POSTs to `/api/equipment-set` and shows the share URL dialog on success
- Generated URL is `<origin><pathname>#set/<key>`
- Copy button briefly shows "Copied!" then reverts
- API/clipboard errors surface inline without crashing
- Existing layout and simulation behaviour unaffected

---

## #32 — `ItemSetsTab.vue` (new component)

**File:** `wsdist-web/src/components/tabs/ItemSetsTab.vue`

### Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `initialKey` | `string` | `''` | If non-empty, auto-loads the set on mount (for URL hash routing) |

### Local state

```typescript
const keyInput = ref('')
const loadedGearset = ref<Gearset | null>(null)
const loadedKey = ref('')
const loading = ref(false)
const error = ref('')
const copiedToClipboard = ref(false)
```

### `doLoad(key)`

Calls `fetchEquipmentSet(key, gearStore.allGear)`. On success, sets `loadedGearset` and `loadedKey`. If `unknownNames` is non-empty, surfaces them as a soft warning in the error area (load still succeeds; affected slots are empty).

On mount: if `initialKey` is non-empty, call `doLoad(initialKey)`.

### Layout

```
┌──────────────────────────────────────────────┐
│  [Key input field]  [Load button]            │
│  Error / unknown-items warning               │
├──────────────────────────────────────────────┤
│  (when loadedGearset is not null)            │
│  Key: brave-coral-...  [Copy Share URL]      │
│                                              │
│  GearPanel (local copy, interactive)         │
│                                              │
│  Apply to: [TP Set 1] [WS Set 1]            │
│            [TP Set 2] [WS Set 2]            │
└──────────────────────────────────────────────┘
```

### GearPanel wiring

- `jobCode` bound to `characterStore.mainJob`
- `context="tp1"` (a valid value; GearPanel requires it but doesn't use it here)
- `@update:gear` updates `loadedGearset.value[slot] = item` — **local only**, no character store writes

### Apply buttons

Four buttons: "TP Set 1", "WS Set 1", "TP Set 2", "WS Set 2".  
Each calls `characterStore.replaceGearset(ctx, loadedGearset.value)` where `ctx` is `'tp1'`, `'ws1'`, `'tp2'`, `'ws2'`.  
**Silent apply** — no tab switch, no confirmation dialog.

### Copy Share URL

Builds `${window.location.origin}${window.location.pathname}#set/${loadedKey.value}`, copies to clipboard, briefly shows "Copied!" (1.5 s).

### Acceptance criteria

- Valid key + Load → GearPanel populated
- Unknown item names → soft warning, affected slots empty, load continues
- GearPanel edits are local-only (character store unchanged)
- Apply buttons write to the correct character-store slot, silently
- Copy Share URL copies the correct URL
- `initialKey` prop triggers auto-load on mount
- Builds with no type errors

---

## #33 — App.vue wiring

**File:** `wsdist-web/src/App.vue`

### New imports

```typescript
import ItemSetsTab from '@/components/tabs/ItemSetsTab.vue'
import { isEquipmentSetHash, extractSetKey } from '@/composables/useEquipmentSetApi'
```

### New refs

```typescript
const activeTab = ref('0')
const itemSetInitialKey = ref('')
```

### Tab numbering

| Tab | Old value | New value |
|---|---|---|
| Job & Enemy | `"0"` | `"0"` (unchanged) |
| Buffs | `"1"` | `"1"` (unchanged) |
| Results | `"2"` | `"2"` (unchanged) |
| Item Sets | — | `"3"` (new, always visible) |
| Automaton | `"3"` | `"4"` (renumbered) |

### Hash routing (`onMounted`)

After `await gearStore.loadGearData()`, before the existing `isValidKey` check:

```typescript
const hash = window.location.hash.replace(/^#/, '').trim()

if (isEquipmentSetHash(hash)) {
  itemSetInitialKey.value = extractSetKey(hash)
  activeTab.value = '3'
} else if (isValidKey(hash)) {
  // ... existing fetchAppState logic — unchanged
}
```

### Template changes

- `<Tabs value="0"` → `<Tabs v-model:value="activeTab"` (two-way binding)
- Add `<Tab value="3">Item Sets</Tab>` in the tab bar (before Automaton)
- Add `<TabPanel value="3"><ItemSetsTab :initial-key="itemSetInitialKey" /></TabPanel>`
- Change Automaton `<Tab>` and `<TabPanel>` from `value="3"` → `value="4"`

### Acceptance criteria

- "Item Sets" tab always visible in tab bar
- `/#set/<key>` opens Item Sets tab with set pre-loaded
- `/#<app-state-key>` still restores full app state (no regression)
- Manual tab clicks work; all other tabs unaffected
- Automaton tab still reachable at position 4
- Build passes with no type errors

---

## Data flow summary

```
ResultsTab: save button
  → POST /api/equipment-set  →  key
  → URL: #set/<key>

App.vue onMounted: isEquipmentSetHash(hash)
  → itemSetInitialKey = extractSetKey(hash)
  → activeTab = '3'

ItemSetsTab: doLoad(initialKey)
  → GET /api/equipment-set/<key>
  → loadedGearset (local)
  → user edits/inspects
  → Apply button → characterStore.replaceGearset(ctx, loadedGearset)
```

---

## Out of scope

- No tab switch on Apply (silent write)
- No undo / history
- No multi-set batch import
- ItemSetsTab does not affect simulation directly; the user must switch to Results to see the effect
