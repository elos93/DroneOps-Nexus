import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

export class CreateDroneDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsNumber()
  @Min(0)
  battery!: number;

  @IsNumber()
  @Min(0)
  maxPayloadKg!: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
}

export class UpdateDroneDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  battery?: number;

  @IsOptional()
  @IsNumber()
  maxPayloadKg?: number;
}

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(1)
  totalSlots!: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;
}

export class UpdateStationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalSlots?: number;
}

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  senderCustomerId!: string;

  @IsString()
  @IsNotEmpty()
  targetCustomerId!: string;

  @IsNumber()
  @Min(0.1)
  payloadKg!: number;

  @IsIn(['standard', 'urgent', 'critical'])
  priority!: 'standard' | 'urgent' | 'critical';

  @IsOptional()
  @IsIn(['standard', 'medical'])
  serviceType?: 'standard' | 'medical';

  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean;

  @IsNumber()
  @Min(1)
  etaMinutes!: number;
}

export class AssignMissionDto {
  @IsString()
  @IsNotEmpty()
  droneId!: string;
}

export class ChargeDroneDto {
  @IsString()
  @IsNotEmpty()
  stationId!: string;
}

export class ReleaseChargeDto {
  @IsNumber()
  @Min(1)
  minutes!: number;
}

export class ConfirmDeliveryDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class QuoteOrderDto {
  @ValidateNested()
  @Type(() => LocationDto)
  origin!: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination!: LocationDto;

  @IsNumber()
  @Min(0.1)
  payloadKg!: number;

  @IsIn(['standard', 'urgent', 'critical'])
  priority!: 'standard' | 'urgent' | 'critical';

  @IsIn(['standard', 'medical'])
  serviceType!: 'standard' | 'medical';

  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean;
}

export class CreatePublicOrderDto extends QuoteOrderDto {
  @IsString()
  @IsNotEmpty()
  senderName!: string;

  @IsEmail()
  senderEmail!: string;

  @IsString()
  @IsNotEmpty()
  senderPhone!: string;

  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @IsEmail()
  recipientEmail!: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone!: string;
}
