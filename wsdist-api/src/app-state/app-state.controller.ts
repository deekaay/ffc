import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { AppStateService } from './app-state.service'
import { SaveAppStateDto } from './dto/save-app-state.dto'

@Controller('app-state')
export class AppStateController {
  constructor(private readonly service: AppStateService) {}

  @Post()
  async save(@Body() dto: SaveAppStateDto): Promise<{ key: string }> {
    const key = await this.service.save(dto.state)
    return { key }
  }

  @Get(':key')
  async get(@Param('key') key: string): Promise<{ state: Record<string, unknown> }> {
    const state = await this.service.get(key)
    return { state }
  }
}
