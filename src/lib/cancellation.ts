export type CancellationResult = {
  refundPercent: number
  refundAmount: number
  message: string
  tier: 'full' | 'half' | 'none'
}

export function getCancellationRefund(
  pickupDate: string,
  pickupTime: string,
  totalPrice: number
): CancellationResult {
  const pickup = new Date(`${pickupDate}T${pickupTime}`)
  const now = new Date()
  const hoursUntil = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntil >= 24) {
    return {
      refundPercent: 100,
      refundAmount: totalPrice,
      message: 'Full refund — more than 24 hours before pickup.',
      tier: 'full',
    }
  }

  if (hoursUntil >= 2) {
    const amount = Math.round(totalPrice * 0.5 * 100) / 100
    return {
      refundPercent: 50,
      refundAmount: amount,
      message: `50% refund ($${amount.toFixed(2)}) — between 2 and 24 hours before pickup.`,
      tier: 'half',
    }
  }

  return {
    refundPercent: 0,
    refundAmount: 0,
    message: 'No refund — less than 2 hours before pickup.',
    tier: 'none',
  }
}

export const POLICY_TIERS = [
  { hours: '24+ hours before', refund: '100% refund', color: 'green' },
  { hours: '2–24 hours before', refund: '50% refund', color: 'amber' },
  { hours: 'Less than 2 hours', refund: 'No refund', color: 'red' },
]
