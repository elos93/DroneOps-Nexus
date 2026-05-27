import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  dispatch(@Body() dto: FlightGateDto) {
    return this.weather.dispatchFlight(dto);
  }

  @Get('forecast/:missionId')
  forecast(@Param('missionId') missionId: string) {
    return this.weather.forecastMission(missionId);
  }
}
