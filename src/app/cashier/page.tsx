'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import CashierDashboard from '@/components/CashierDashboard'

export default function CashierPage() {
  return (
    <ProtectedRoute allowedRoles={['cashier']}>
      <CashierDashboard />
    </ProtectedRoute>
  )
}

