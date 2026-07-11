export type StickerStatus = 'active' | 'inactive';

export type IncidentStatus = 'pending' | 'notified' | 'failed' | 'resolved' | 'cancelled';

export interface Sticker {
  id: string;
  status: StickerStatus;
  vehicle_hint: string | null;
}

export interface TriggerSmsResponse {
  incident_id: string;
  status: IncidentStatus;
  error?: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  name: string | null;
  phone_number: string | null;
}

export interface Vehicle {
  id: string;
  status: StickerStatus;
  vehicle_hint: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  sticker_id: string;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
}
