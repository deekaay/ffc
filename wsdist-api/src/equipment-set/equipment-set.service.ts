import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { EquipmentSet, EquipmentSetDocument } from './equipment-set.schema'
import { KeyGeneratorService } from '../common/key-generator.service'

@Injectable()
export class EquipmentSetService {
  constructor(
    @InjectModel(EquipmentSet.name)
    private readonly model: Model<EquipmentSetDocument>,
    private readonly keyGen: KeyGeneratorService,
  ) {}

  async save(slots: Record<string, string>): Promise<string> {
    let key: string
    do {
      key = this.keyGen.generate()
    } while (await this.model.exists({ key }))

    await this.model.create({ key, slots })
    return key
  }

  async get(key: string): Promise<Record<string, string>> {
    const doc = await this.model.findOne({ key }).lean()
    if (!doc) throw new NotFoundException(`No equipment set found for key "${key}"`)
    return doc.slots
  }
}
