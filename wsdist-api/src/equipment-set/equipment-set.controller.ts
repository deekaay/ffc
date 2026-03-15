import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { EquipmentSetService } from './equipment-set.service'
import { SaveEquipmentSetDto } from './dto/save-equipment-set.dto'

@Controller('equipment-set')
export class EquipmentSetController {
  constructor(private readonly service: EquipmentSetService) {}

  @Post()
  async save(@Body() dto: SaveEquipmentSetDto): Promise<{ key: string }> {
    const key = await this.service.save(dto.slots)
    return { key }
  }

  @Get(':key')
  async get(@Param('key') key: string): Promise<{ slots: Record<string, string> }> {
    const slots = await this.service.get(key)
    return { slots }
  }
}
