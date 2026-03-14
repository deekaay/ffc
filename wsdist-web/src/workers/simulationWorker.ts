import { runSimulation } from '@/calc/actions'
import type { Player } from '@/types/player'
import type { EnemyStats } from '@/types/enemy'

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return

  const { playerTp, playerWs, enemy, wsThreshold, wsName, wsType } = e.data as {
    playerTp: Player
    playerWs: Player
    enemy: EnemyStats
    wsThreshold: number
    wsName: string
    wsType: string
  }

  const result = runSimulation(
    playerTp,
    playerWs,
    enemy,
    wsThreshold,
    wsName,
    wsType,
    (pct: number) => {
      self.postMessage({ type: 'progress', percent: pct })
    },
  )

  self.postMessage({ type: 'result', data: result })
}
