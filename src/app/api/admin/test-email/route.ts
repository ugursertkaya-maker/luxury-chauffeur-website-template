import { getAdminSession } from '@/lib/auth'
import {
  sendBookingConfirmation,
  sendModificationReceived,
  sendModificationApproved,
  sendCancellationEmail,
  sendDriverAssignedEmail,
} from '@/lib/email'

const MOCK = {
  email: '',
  name: 'Test Customer',
  booking_number: 'MAX-TEST-001',
  service_type: 'airport_transfer',
  pickup_date: '2026-07-15',
  pickup_time: '09:00 AM',
  pickup_location: 'Example International Airport — Terminal 1',
  dropoff_location: 'Example Grand Hotel',
  passengers: 2,
  total_price: 85,
  flight_number: 'AA1234',
  notes: 'Please have water bottles ready.',
  driver_name: 'Carlos R.',
  driver_phone: '+1 (555) 000-0000',
  vehicle_make: 'GMC',
  vehicle_model: 'Premium SUV',
  vehicle_plate: 'MA-KEY001',
  refunded: true,
  refund_amount: 85,
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, email } = await request.json()
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

  const data = { ...MOCK, email }

  try {
    switch (type) {
      case 'confirmation':
        await sendBookingConfirmation(data)
        break
      case 'modification_received':
        await sendModificationReceived(data)
        break
      case 'modification_approved':
        await sendModificationApproved(data)
        break
      case 'cancellation':
        await sendCancellationEmail(data)
        break
      case 'driver_assigned':
        await sendDriverAssignedEmail(data)
        break
      default:
        return Response.json({ error: 'Unknown type' }, { status: 400 })
    }
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
