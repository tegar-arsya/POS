'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface cashiers {
    id: string
    tableNumber: number
    mainDish: string
    drink: string
    notes: string
    status: string
    createdAt: Date
  }

export default function BarDashboard() {
  const [orders, setOrders] = useState<cashiers[]>([]) // Initialize with an empty array of cashiers([])

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('assignedTo', '==', 'bar'),
      where('status', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'asc')
    )
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            tableNumber: doc.data().tableNumber,
            mainDish: doc.data().mainDish,
            drink: doc.data().drink,
            notes: doc.data().notes,
            status: doc.data().status,
            createdAt: doc.data().createdAt,
          }))
      setOrders(ordersData)
    })
    return () => unsubscribe()
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus })
}

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Bar Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Table {order.tableNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Drink: {order.drink}</p>
              <p>Notes: {order.notes}</p>
              <p>Status: {order.status}</p>
              {order.status === 'pending' && (
                <Button onClick={() => updateOrderStatus(order.id, 'preparing')} className="mt-2">
                  Start Preparing
                </Button>
              )}
              {order.status === 'preparing' && (
                <Button onClick={() => updateOrderStatus(order.id, 'ready')} className="mt-2">
                  Mark as Ready
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

