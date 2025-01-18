'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
export default function CashierDashboard() {
  const [orders, setOrders] = useState<cashiers[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [mainDish, setMainDish] = useState('')
  const [drink, setDrink] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            tableNumber: doc.data().tableNumber,
            mainDish: doc.data().mainDish,
            drink: doc.data().drink,
            notes: doc.data().notes,
            status: doc.data().status,
            createdAt: doc.data().createdAt,
        }));
      setOrders(ordersData)
    })
    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    await addDoc(collection(db, 'orders'), {
      tableNumber,
      mainDish,
      drink,
      notes,
      status: 'pending',
      createdAt: new Date()
    })
    setTableNumber('')
    setMainDish('')
    setDrink('')
    setNotes('')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Cashier Dashboard</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Table Number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            required
          />
          <Input
            placeholder="Main Dish"
            value={mainDish}
            onChange={(e) => setMainDish(e.target.value)}
            required
          />
          <Input
            placeholder="Drink"
            value={drink}
            onChange={(e) => setDrink(e.target.value)}
            required
          />
          <Textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="mt-4">Submit Order</Button>
      </form>
      <div className="grid grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Table {order.tableNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Main Dish: {order.mainDish}</p>
              <p>Drink: {order.drink}</p>
              <p>Notes: {order.notes}</p>
              <p>Status: {order.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

