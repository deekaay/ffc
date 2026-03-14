import { defineStore } from 'pinia'
import type { QuicklookResults } from '@/types/simulation'
import { buildPlayer, buildEnemy } from '@/calc/createPlayer'
import { averageAttackRound, averageWs } from '@/calc/actions'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useBuffStore } from '@/stores/useBuffStore'
import { useGearStore } from '@/stores/useGearStore'
import type { GearItem } from '@/types/gear'
import type { EnemyStats } from '@/types/enemy'

export const useSimulationStore = defineStore('simulation', {
  state: () => ({
    quicklookResults: null as QuicklookResults | null,
  }),

  actions: {
    /**
     * Build a Player object from the current character + buff state.
     * context: 'quicklook' | 'tp' | 'ws'
     */
    buildCurrentPlayer(context: 'quicklook' | 'tp' | 'ws') {
      const charStore = useCharacterStore()
      const buffStore = useBuffStore()
      const gearStore = useGearStore()

      const gearset = context === 'tp' ? charStore.tpGearset
                    : context === 'ws' ? charStore.wsGearset
                    : charStore.quicklookGearset

      const { buffs, debuffs: _debuffs } = buffStore.aggregatedBuffs
      void _debuffs // debuffs applied to enemy separately

      // Inject food into buffs.food from allFood lookup
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

      // Add stormSpell name to abilities for enspell calc
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
      // Apply Base Defense for Nandaka calculation
      enemyRaw['Base Defense'] = charStore.enemy.Defense

      const enemy = buildEnemy(enemyRaw)

      // Apply debuffs to enemy stats
      for (const [stat, val] of Object.entries(debuffs)) {
        const key = stat as keyof EnemyStats
        if (key in enemy) {
          (enemy[key] as number) -= val
        }
      }

      return enemy
    },

    runQuicklook() {
      try {
        const charStore = useCharacterStore()
        const player = this.buildCurrentPlayer('quicklook')
        const enemy = this.buildCurrentEnemy()

        const tpRound = averageAttackRound(player, enemy, charStore.wsThreshold / 2, charStore.wsThreshold, false)
        const wsResult = averageWs(player, enemy, charStore.wsName, charStore.wsThreshold, 'Damage dealt', false)

        const timePerAttackRound = (player.stats['timePerAttackRound'] as number) ?? 3
        const avgTpRoundDmg = tpRound.physicalDamage + tpRound.magicalDamage

        // Time to WS: time to accumulate wsThreshold TP
        const tpPerRound = tpRound.tpReturn || 1
        const roundsToWs = Math.max(1, (charStore.wsThreshold - (player.stats['TP Bonus'] as number ?? 0)) / tpPerRound)
        const timeToWs = roundsToWs * timePerAttackRound + 2.0 // +2s forced delay

        const tpPhaseDamage = roundsToWs * avgTpRoundDmg
        const totalCycleTime = timeToWs
        const dps = (tpPhaseDamage + wsResult.damage) / totalCycleTime

        this.quicklookResults = {
          wsDamage: wsResult.damage,
          tpRoundDamage: avgTpRoundDmg,
          timePerWs: timeToWs,
          dps,
          wsDmgBreakdown: {},
        }
      } catch (e) {
        console.error('Quicklook failed:', e)
      }
    },

  },
})
