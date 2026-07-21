export type VehicleType = 'bajaj' | 'motorbike' | 'car' | 'minibus' | 'truck';
export type StationStatus = 'fast' | 'busy' | 'packed' | 'out_of_fuel';
export type TokenStatus = 'waiting' | 'serving' | 'completed' | 'canceled';
export type UserRole = 'SuperAdmin' | 'StationManager' | 'StationAttendant';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  stationId?: string;
  displayName: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface GasStation {
  id: string;
  nameAm: string;
  nameEn: string;
  locationAm: string;
  locationEn: string;
  status: StationStatus;
  currentNumber: number;
  lastNumber: number; // The highest token number issued so far
  totalWaiting: number;
  updatedAt: string;
  currentAllowedVehicle: VehicleType | 'all'; // Station-controlled service days parameter
  totalFuelLiters: number; // Configured total tank capacity/input
  currentAvailableLiters: number; // Computed remaining unallocated fuel
}

export interface QueueToken {
  id: string;
  stationId: string;
  tokenNumber: number;
  plateNumber: string;
  vehicleType: VehicleType;
  phoneNumber: string;
  status: TokenStatus;
  createdAt: string;
  servingAt?: string;
  completedAt?: string;
  estimatedTime: number; // in minutes
  securityToken?: string; // Private driver access token
  requestedLiters: number; // Fuel requested in liters
  isLowFuelWarning?: boolean; // Flag if fuel might run out before their turn
}

export interface SMSAlert {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  tokenNumber: number;
  plateNumber: string;
}

