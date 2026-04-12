import { defineStore } from 'pinia'
import type { SetResults, ThresholdComparisonRow, TpThreshold } from '@/types/simulation'
import type { Player } from '@/types/player'
import { buildPlayer, buildEnemy } from '@/calc/createPlayer'
import { averageAttackRound, averageWs } from '@/calc/actions'
import { getDelayTiming } from '@/calc/getDelayTiming'
import { useCharacterStore } from '@/stores/useCharacterStore'
import type { GearContext } from '@/stores/useCharacterStore'
import { RANGED_WS } from '@/data/weaponskillsByJob'
import { useBuffStore } from '@/stores/useBuffStore'
import { useGearStore } from '@/stores/useGearStore'
import type { GearItem } from '@/types/gear'
import type { EnemyStats } from '@/types/enemy'

export const useSimulationStore = defineStore('simulation', {
  state: () => ({
    set1Results: null as SetResults | null,
    set2Results: null as SetResults | null,
    players: {
      tp1: null as Player | null,
      ws1: null as Player | null,
      tp2: null as Player | null,
      ws2: null as Player | null,
    },
  }),

  actions: {
    calculateSetResults(
      tpPlayer: Player,
      wsPlayer: Player,
      enemy: EnemyStats,
      wsName: string,
      wsThreshold: number,
      wsType: 'melee' | 'ranged',
    ): SetResults {
      const tpRound = averageAttackRound(tpPlayer, enemy, wsThreshold / 2, wsThreshold, false)
      const wsResult = averageWs(wsPlayer, enemy, wsName, wsThreshold, wsType, false)

      const dualWield =
        (tpPlayer.gearset['sub'].Type === 'Weapon') ||
        (tpPlayer.gearset['main']['Skill Type'] === 'Hand-to-Hand')
      const mainSkillType = (tpPlayer.gearset['main']['Skill Type'] as string) ?? ''
      const timePerAttackRound = Math.max(0, getDelayTiming(
        (tpPlayer.stats['Delay1'] as number) ?? 0,
        dualWield && mainSkillType !== 'Hand-to-Hand' ? ((tpPlayer.stats['Delay2'] as number) ?? 0) : 0,
        ((tpPlayer.stats['Dual Wield'] as number) ?? 0) / 100,
        (tpPlayer.stats['Martial Arts'] as number) ?? 0,
        (tpPlayer.stats['Magic Haste'] as number) ?? 0,
        (tpPlayer.stats['JA Haste'] as number) ?? 0,
        (tpPlayer.stats['Gear Haste'] as number) ?? 0,
      ))
      const avgTpRoundDmg = tpRound.physicalDamage + tpRound.magicalDamage

      // In the non-simulation path, averageAttackRound returns time-to-WS in tpReturn.
      const tpPhaseTime = tpRound.tpReturn > 0 ? tpRound.tpReturn : 9999
      const roundsToWs = timePerAttackRound > 0 ? Math.max(1, tpPhaseTime / timePerAttackRound) : 1
      const timeToWs = tpPhaseTime + 2.0

      const tpPhaseDamage = roundsToWs * avgTpRoundDmg
      const dps = (tpPhaseDamage + wsResult.damage) / timeToWs

      return {
        wsDamage: wsResult.damage,
        tpRoundDamage: avgTpRoundDmg,
        timePerWs: timeToWs,
        dps,
        autoAttackDps: tpPhaseDamage / timeToWs,
        wsDps: wsResult.damage / timeToWs,
        wsDmgBreakdown: {},
        thresholdComparisons: [],
        optimalThreshold: 1000,
      }
    },

    buildCurrentPlayer(context: GearContext) {
      const charStore = useCharacterStore()
      const buffStore = useBuffStore()
      const gearStore = useGearStore()

      const gearset = context === 'tp1' ? charStore.tpGearset
                    : context === 'ws1' ? charStore.wsGearset
                    : context === 'tp2' ? charStore.tpGearset2
                    : charStore.wsGearset2

      const { buffs, debuffs: _debuffs } = buffStore.aggregatedBuffs
      void _debuffs

      const foodName = buffStore.food
      const foodItem = gearStore.allFood[foodName]
      if (foodItem) {
        const foodBuf: Record<string, number> = {}
        const skip = new Set(['Name', 'Name2', 'Type', 'Jobs', 'Skill Type', 'Rank', 'DMG', 'Delay'])
        for (const [stat, val] of Object.entries(foodItem as GearItem)) {
          if (skip.has(stat)) continue
          if (stat === 'Attack') foodBuf['Food Attack'] = (foodBuf['Food Attack'] ?? 0) + (val as number)
          else if (stat === 'Ranged Attack') foodBuf['Food Ranged Attack'] = (foodBuf['Food Ranged Attack'] ?? 0) + (val as number)
          else foodBuf[stat] = (foodBuf[stat] ?? 0) + (val as number)
        }
        buffs['food'] = foodBuf
      }

      const abilities: Record<string, boolean | number | string> = {
        ...charStore.abilities,
        'Storm spell': buffStore.stormSpell !== 'None' ? buffStore.stormSpell : 'None',
      }

      return buildPlayer(
        charStore.mainJob,
        charStore.subJob,
        charStore.masterLevel,
        gearset,
        buffs as Record<string, Record<string, number>>,
        abilities,
      )
    },

    buildCurrentEnemy(): EnemyStats {
      const charStore = useCharacterStore()
      const buffStore = useBuffStore()
      const { debuffs } = buffStore.aggregatedBuffs

      const enemyRaw = { ...charStore.enemy } as Record<string, unknown>
      enemyRaw['Base Defense'] = charStore.enemy.Defense

      const enemy = buildEnemy(enemyRaw)

      for (const [stat, val] of Object.entries(debuffs)) {
        const key = stat as keyof EnemyStats
        if (key in enemy) {
          (enemy[key] as number) -= val
        }
      }

      return enemy
    },

    runPair(pair: 1 | 2) {
      try {
        const charStore = useCharacterStore()
        const tpContext: GearContext = pair === 1 ? 'tp1' : 'tp2'
        const wsContext: GearContext = pair === 1 ? 'ws1' : 'ws2'

        const tpPlayer = this.buildCurrentPlayer(tpContext)
        const wsPlayer = this.buildCurrentPlayer(wsContext)
        const enemy = this.buildCurrentEnemy()

        const wsType = RANGED_WS.has(charStore.wsName) ? 'ranged' : 'melee'
        const thresholds: TpThreshold[] = [1000, 2000, 3000]
        const thresholdComparisons = thresholds.map((threshold) => {
          const result = this.calculateSetResults(tpPlayer, wsPlayer, enemy, charStore.wsName, threshold, wsType)
          return {
            threshold,
            wsDamage: result.wsDamage,
            timePerWs: result.timePerWs,
            dps: result.dps,
            isOptimal: false,
          } satisfies ThresholdComparisonRow
        })
        const bestDps = Math.max(...thresholdComparisons.map((row) => row.dps))
        const comparisonRows = thresholdComparisons.map((row) => ({
          ...row,
          isOptimal: row.dps === bestDps,
        }))
        const optimalThreshold = comparisonRows.find((row) => row.isOptimal)?.threshold ?? 1000

        const result = this.calculateSetResults(tpPlayer, wsPlayer, enemy, charStore.wsName, charStore.wsThreshold, wsType)
        result.thresholdComparisons = comparisonRows
        result.optimalThreshold = optimalThreshold

        if (pair === 1) {
          this.set1Results = result
          this.players.tp1 = tpPlayer
          this.players.ws1 = wsPlayer
        } else {
          this.set2Results = result
          this.players.tp2 = tpPlayer
          this.players.ws2 = wsPlayer
        }
      } catch (e) {
        console.error(`runPair(${pair}) failed:`, e)
      }
    },
  },
})
