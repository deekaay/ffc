import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AppStateDocument = HydratedDocument<AppState>

@Schema({ timestamps: true })
export class AppState {
  @Prop({ required: true, unique: true, index: true })
  key: string

  /**
   * Full serialised app state: job, WS, enemy, buffs, abilities,
   * and all four gearsets (tp1, ws1, tp2, ws2).
   */
  @Prop({ type: Object, required: true })
  state: Record<string, unknown>
}

export const AppStateSchema = SchemaFactory.createForClass(AppState)
