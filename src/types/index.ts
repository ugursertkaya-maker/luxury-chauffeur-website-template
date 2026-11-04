export type ServiceType = 'airport' | 'wedding' | 'hourly' | 'corporate' | 'cruise' | 'event'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'modification_requested'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface Booking {
  id: string
  created_at: string
  service_type: ServiceType
  pickup_location: string
  dropoff_location: string
  pickup_date: string
  pickup_time: string
  hours?: number
  passengers: number
  name: string
  email: string
  phone: string
  notes?: string
  distance_miles?: number
  duration_minutes?: number
  base_price: number
  total_price: number
  status: BookingStatus
  payment_status: PaymentStatus
  stripe_payment_intent_id?: string
  flight_number?: string
  booking_number?: string
  pending_changes?: Record<string, string> | null
}

export interface PriceCalculation {
  base: number
  per_mile: number | null
  per_hour: number | null
  distance_charge: number
  time_charge: number
  surcharges: { label: string; amount: number }[]
  total: number
  breakdown: string[]
}
