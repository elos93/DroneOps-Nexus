import { Body, Controller, Post } from '@nestjs/common';
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
}
