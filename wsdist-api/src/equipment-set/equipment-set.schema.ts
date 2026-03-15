import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type EquipmentSetDocument = HydratedDocument<EquipmentSet>

@Schema({ timestamps: true })
export class EquipmentSet {
  @Prop({ required: true, unique: true, index: true })
  key: string

  /** Slot → Name2 mapping for the 16 gear slots. */
  @Prop({ type: Object, required: true })
  slots: Record<string, string>
}

export const EquipmentSetSchema = SchemaFactory.createForClass(EquipmentSet)
