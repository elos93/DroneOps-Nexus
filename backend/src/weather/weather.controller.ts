import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { FlightGateDto } from './dto/flight-gate.dto';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Post('flight-gate')
  flightGate(@Body() dto: FlightGateDto) {
    return this.weather.assessFlight(dto);
  }

  @Post('dispatch')
  @UseGuards(AuthGuard)
  @Roles('admin', 'dispatcher')
  dispatch(@Body() dto: FlightGateDto) {
    return this.weather.dispatchFlight(dto);
  }

  @Get('forecast/:missionId')
  forecast(@Param('missionId') missionId: string) {
    return this.weather.forecastMission(missionId);
  }
}
