import { Schema } from 'mongoose';

const LocationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const MissionEventSchema = new Schema(
  {
    status: { type: String, required: true },
    title: { type: String, required: true },
    timestamp: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false },
);

export const DroneSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    model: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['available', 'charging', 'mission'],
    },
    battery: { type: Number, required: true, min: 0, max: 100 },
    maxPayloadKg: { type: Number, required: true },
    location: { type: LocationSchema, required: true },
    activeMissionId: { type: String },
    chargingStationId: { type: String },
    flightHours: { type: Number, required: true, default: 0 },
    completedDeliveries: { type: Number, required: true, default: 0 },
    batteryHealth: { type: Number, required: true, default: 100 },
    nextServiceHours: { type: Number, required: true, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const MissionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    senderCustomerId: { type: String, required: true },
    targetCustomerId: { type: String, required: true },
    customer: { type: String, required: true },
    origin: { type: LocationSchema, required: true },
    destination: { type: LocationSchema, required: true },
    payloadKg: { type: Number, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['standard', 'urgent', 'critical'],
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['standard', 'medical'],
      default: 'standard',
    },
    temperatureControlled: { type: Boolean, default: false },
    priceIls: { type: Number },
    routeDistanceKm: { type: Number },
    routeWaypoints: { type: [LocationSchema], default: [] },
    routeNotice: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'assigned', 'in-transit', 'delivered'],
    },
    droneId: { type: String },
    etaMinutes: { type: Number, required: true },
    progressPercent: { type: Number, required: true, default: 0 },
    trackingCode: { type: String, required: true },
    proofOfDeliveryCode: { type: String, required: true },
    timeline: { type: [MissionEventSchema], required: true, default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const StationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    totalSlots: { type: Number, required: true },
    occupiedSlots: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CustomerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AuditEventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    actor: { type: String, required: true },
    timestamp: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { timestamps: true },
);
