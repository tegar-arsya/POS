'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import BarDashboard from '@/components/BarDashboard'

export default function BarPage() {
  return (
    <ProtectedRoute allowedRoles={['bar']}>
      <BarDashboard />
    </ProtectedRoute>
  )
}

