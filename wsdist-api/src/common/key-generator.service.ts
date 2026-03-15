import { Injectable } from '@nestjs/common'
import { WORDS } from './wordlist'

@Injectable()
export class KeyGeneratorService {
  /** Generate a random 5-word key, e.g. "brave-coral-swift-maple-stage". */
  generate(): string {
    const picks: string[] = []
    for (let i = 0; i < 5; i++) {
      picks.push(WORDS[Math.floor(Math.random() * WORDS.length)])
    }
    return picks.join('-')
  }
}
