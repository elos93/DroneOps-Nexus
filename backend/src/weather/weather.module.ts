import { Module } from '@nestjs/common';
import { OperationsModule } from '../operations/operations.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
  imports: [OperationsModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
