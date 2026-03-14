export interface SongSlot {
  name: string
}

export interface RollSlot {
  name: string
  value: string
}

export interface BubbleSlot {
  type: 'Indi' | 'Geo' | 'Entrust'
  name: string
}

export type BuffCollection = Record<string, unknown>
