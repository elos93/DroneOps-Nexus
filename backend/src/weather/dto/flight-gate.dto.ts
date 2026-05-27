import { IsNotEmpty, IsString } from 'class-validator';

export class FlightGateDto {
  @IsString()
  @IsNotEmpty()
  droneId!: string;

  @IsString()
  @IsNotEmpty()
  missionId!: string;
}
