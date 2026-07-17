export type StickerStatus = 'active' | 'inactive';

export type IncidentStatus = 'pending' | 'notified' | 'failed' | 'resolved' | 'cancelled';

export type VehicleType = 'car' | 'bike' | 'scooter' | 'auto' | 'bus' | 'truck' | 'other';

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'auto', label: 'Auto' },
  { value: 'bus', label: 'Bus' },
  { value: 'truck', label: 'Truck' },
  { value: 'other', label: 'Other' },
];

export interface Sticker {
  id: string;
  status: StickerStatus;
  vehicle_hint: string | null;
  vehicle_type: VehicleType | null;
}

export interface TriggerSmsResponse {
  incident_id: string;
  status: IncidentStatus;
  error?: string;
}

export type Plan = 'free' | 'premium' | 'premium_pro';

export const PLANS: { value: Plan; label: string; priceMonthly: number | null; priceYearly: number | null }[] = [
  { value: 'free', label: 'Free', priceMonthly: null, priceYearly: null },
  { value: 'premium', label: 'Premium', priceMonthly: 10, priceYearly: 100 },
  { value: 'premium_pro', label: 'Premium Pro', priceMonthly: 20, priceYearly: 200 },
];

export interface Profile {
  id: string;
  auth_user_id: string;
  name: string | null;
  phone_number: string | null;
  plan: Plan;
}

export interface AdminUser {
  id: string;
  name: string | null;
  phone_number: string | null;
  plan: Plan;
  created_at: string;
}

export interface Vehicle {
  id: string;
  status: StickerStatus;
  vehicle_hint: string | null;
  vehicle_type: VehicleType | null;
  created_at: string;
}

export interface Incident {
  id: string;
  sticker_id: string;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
}
