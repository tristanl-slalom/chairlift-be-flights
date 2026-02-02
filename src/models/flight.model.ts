import { z } from 'zod';

// Flight status enum
export const FlightStatus = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  IN_FLIGHT: 'IN_FLIGHT',
  LANDED: 'LANDED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED'
} as const;

export type FlightStatus = typeof FlightStatus[keyof typeof FlightStatus];

// Seat capacity schema
const SeatCapacitySchema = z.object({
  economy: z.number().int().min(0),
  business: z.number().int().min(0),
  first: z.number().int().min(0)
});

// Pricing schema
const PricingSchema = z.object({
  economy: z.number().min(0),
  business: z.number().min(0),
  first: z.number().min(0)
});

// Create flight schema
export const CreateFlightSchema = z.object({
  flightNumber: z.string().min(1).max(10),
  airlineCode: z.string().length(2),
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(1),
  aircraft: z.string().min(1).max(50),
  capacity: SeatCapacitySchema,
  pricing: PricingSchema,
  status: z.enum(['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_FLIGHT', 'LANDED', 'CANCELLED', 'DELAYED']).optional().default('SCHEDULED')
});

// Update flight schema
export const UpdateFlightSchema = z.object({
  flightNumber: z.string().min(1).max(10).optional(),
  airlineCode: z.string().length(2).optional(),
  origin: z.string().length(3).optional(),
  destination: z.string().length(3).optional(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().int().min(1).optional(),
  aircraft: z.string().min(1).max(50).optional(),
  capacity: SeatCapacitySchema.optional(),
  pricing: PricingSchema.optional(),
  status: z.enum(['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_FLIGHT', 'LANDED', 'CANCELLED', 'DELAYED']).optional()
});

// Update seats schema (for seat inventory management)
export const UpdateSeatsSchema = z.object({
  economy: z.number().int().min(0).optional(),
  business: z.number().int().min(0).optional(),
  first: z.number().int().min(0).optional()
});

export type CreateFlightInput = z.infer<typeof CreateFlightSchema>;
export type UpdateFlightInput = z.infer<typeof UpdateFlightSchema>;
export type UpdateSeatsInput = z.infer<typeof UpdateSeatsSchema>;

export interface SeatCapacity {
  economy: number;
  business: number;
  first: number;
}

export interface Pricing {
  economy: number;
  business: number;
  first: number;
}

export interface Flight {
  flightId: string;
  flightNumber: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: number;
  aircraft: string;
  capacity: SeatCapacity;
  availableSeats: SeatCapacity;
  pricing: Pricing;
  status: FlightStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBFlight {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  GSI3PK: string;
  GSI3SK: string;
  flightId: string;
  flightNumber: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: number;
  aircraft: string;
  capacity: SeatCapacity;
  availableSeats: SeatCapacity;
  pricing: Pricing;
  status: FlightStatus;
  createdAt: string;
  updatedAt: string;
}
