'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-white hover:text-white transition-colors mb-8 block"
    >
      ← Back
    </button>
  )
}
