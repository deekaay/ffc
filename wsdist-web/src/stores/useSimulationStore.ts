import { defineStore } from 'pinia'
import type { SetResults } from '@/types/simulation'
import { buildPlayer, buildEnemy } from '@/calc/createPlayer'
import { averageAttackRound, averageWs } from '@/calc/actions'
import { useCharacterStore } from '@/stores/useCharacterStore'
import type { GearContext } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import { useGearStore } from '@/stores/useGearStore'
import type { GearItem } from '@/types/gear'
import type { EnemyStats } from '@/types/enemy'

export const useSimulationStore = defineStore('simulation', {
  state: () => ({
    set1Results: null as SetResults | null,
    set2Results: null as SetResults | null,
  }),

  actions: {
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

        const tpRound = averageAttackRound(tpPlayer, enemy, charStore.wsThreshold / 2, charStore.wsThreshold, false)
        const wsResult = averageWs(wsPlayer, enemy, charStore.wsName, charStore.wsThreshold, 'Damage dealt', false)

        const timePerAttackRound = (tpPlayer.stats['timePerAttackRound'] as number) ?? 3
        const avgTpRoundDmg = tpRound.physicalDamage + tpRound.magicalDamage

        const tpPerRound = tpRound.tpReturn || 1
        const roundsToWs = Math.max(1, (charStore.wsThreshold - (tpPlayer.stats['TP Bonus'] as number ?? 0)) / tpPerRound)
        const timeToWs = roundsToWs * timePerAttackRound + 2.0

        const tpPhaseDamage = roundsToWs * avgTpRoundDmg
        const dps = (tpPhaseDamage + wsResult.damage) / timeToWs

        const result: SetResults = {
          wsDamage: wsResult.damage,
          tpRoundDamage: avgTpRoundDmg,
          timePerWs: timeToWs,
          dps,
          wsDmgBreakdown: {},
        }

        if (pair === 1) this.set1Results = result
        else this.set2Results = result
      } catch (e) {
        console.error(`runPair(${pair}) failed:`, e)
      }
    },
  },
})
