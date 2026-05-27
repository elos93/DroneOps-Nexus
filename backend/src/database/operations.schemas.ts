import { Schema } from 'mongoose';

const LocationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    label: { type: String, required: true },
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
  },
  { timestamps: true },
);

export const MissionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customer: { type: String, required: true },
    origin: { type: LocationSchema, required: true },
    destination: { type: LocationSchema, required: true },
    payloadKg: { type: Number, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['standard', 'urgent', 'critical'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'assigned', 'in-transit', 'delivered'],
    },
    droneId: { type: String },
    etaMinutes: { type: Number, required: true },
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
  },
  { timestamps: true },
);
