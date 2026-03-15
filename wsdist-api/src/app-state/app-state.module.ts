import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AppState, AppStateSchema } from './app-state.schema'
import { AppStateService } from './app-state.service'
import { AppStateController } from './app-state.controller'
import { KeyGeneratorService } from '../common/key-generator.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppState.name, schema: AppStateSchema },
    ]),
  ],
  providers: [AppStateService, KeyGeneratorService],
  controllers: [AppStateController],
})
export class AppStateModule {}
