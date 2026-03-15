import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AppState, AppStateDocument } from './app-state.schema'
import { KeyGeneratorService } from '../common/key-generator.service'

@Injectable()
export class AppStateService {
  constructor(
    @InjectModel(AppState.name)
    private readonly model: Model<AppStateDocument>,
    private readonly keyGen: KeyGeneratorService,
  ) {}

  async save(state: Record<string, unknown>): Promise<string> {
    let key: string
    do {
      key = this.keyGen.generate()
    } while (await this.model.exists({ key }))

    await this.model.create({ key, state })
    return key
  }

  async get(key: string): Promise<Record<string, unknown>> {
    const doc = await this.model.findOne({ key }).lean()
    if (!doc) throw new NotFoundException(`No app state found for key "${key}"`)
    return doc.state
  }
}
