import { IsObject, IsString } from 'class-validator'

export class SaveEquipmentSetDto {
  @IsObject()
  slots: Record<string, string>
}

export class EquipmentSetKeyDto {
  @IsString()
  key: string
}
