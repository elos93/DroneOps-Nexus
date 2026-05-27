import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DocsController } from './docs.controller';
import { DatabaseModule } from './database/database.module';
import { OperationsModule } from './operations/operations.module';
import { WeatherModule } from './weather/weather.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    OperationsModule,
    WeatherModule,
  ],
  controllers: [AppController, DocsController],
})
export class AppModule {}
