import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EquipmentSet, EquipmentSetSchema } from './equipment-set.schema'
import { EquipmentSetService } from './equipment-set.service'
import { EquipmentSetController } from './equipment-set.controller'
import { KeyGeneratorService } from '../common/key-generator.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EquipmentSet.name, schema: EquipmentSetSchema },
    ]),
  ],
  providers: [EquipmentSetService, KeyGeneratorService],
  controllers: [EquipmentSetController],
})
export class EquipmentSetModule {}
