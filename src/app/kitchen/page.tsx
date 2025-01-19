'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import KitchenDashboard from '@/components/KitchenDashboard'

export default function KitchenPage() {
  return (
    <ProtectedRoute allowedRoles={['kitchen']}>
      <KitchenDashboard />
    </ProtectedRoute>
  )
}

