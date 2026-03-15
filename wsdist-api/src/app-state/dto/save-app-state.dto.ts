import { IsObject } from 'class-validator'

export class SaveAppStateDto {
  @IsObject()
  state: Record<string, unknown>
}
