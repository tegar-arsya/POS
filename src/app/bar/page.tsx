'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Beer, Clock, CheckCircle2, Timer, Wine, AlertCircle, Coffee } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  category: string
}

interface OrderItem {
  itemId: string
  name: string
  quantity: number
  notes: string
}

interface Order {
  id: string
  customerName: string
  tableNumber: number
  barItems: OrderItem[]
  barStatus: string
  createdAt: Date
}

export default function BarDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    const fetchMenuItems = async () => {
      const menuSnapshot = await getDocs(collection(db, 'menu'))
      const menuData = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem))
      setMenuItems(menuData)
    }
    fetchMenuItems()

    const q = query(
      collection(db, 'orders'),
      where('barStatus', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'asc')
    )
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order))
      setOrders(ordersData)
    })
    return () => unsubscribe()
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', orderId), { barStatus: newStatus })
  }

  const isDrinkItem = (itemId: string) => {
    const menuItem = menuItems.find(item => item.id === itemId)
    return menuItem && menuItem.category === 'drink'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'preparing':
        return <Timer className="w-5 h-5 text-blue-500" />
      case 'ready':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getDrinkIcon = (name: string) => {
    if (name.toLowerCase().includes('coffee')) {
      return <Coffee className="w-4 h-4 text-amber-700" />
    } else if (name.toLowerCase().includes('wine')) {
      return <Wine className="w-4 h-4 text-red-700" />
    }
    return <Beer className="w-4 h-4 text-amber-500" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8 animate-fade-in-down">
          <Beer className="w-8 h-8 mr-3 text-amber-600" />
          <h1 className="text-4xl font-bold text-gray-800">Bar Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className={`card-hover animate-slide-in overflow-hidden border-l-4 ${
                order.barStatus === 'pending' 
                  ? 'border-l-yellow-500' 
                  : order.barStatus === 'preparing' 
                    ? 'border-l-blue-500' 
                    : 'border-l-green-500'
              }`}
            >
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Beer className="w-5 h-5 mr-2 text-amber-600" />
                    <span>Table {order.tableNumber}</span>
                  </div>
                  <span className="text-sm font-normal text-gray-500">
                  {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'Invalid Date'}
                  </span>
                </CardTitle>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span>Nama Customer : {order.customerName}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {order.barItems && order.barItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        {getDrinkIcon(item.name)}
                        <span className="font-medium text-gray-800 ml-2">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                      {item.notes && (
                        <span className="text-sm text-gray-500 italic ml-2">
                          ({item.notes})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.barStatus)}`}>
                    {getStatusIcon(order.barStatus)}
                    <span className="ml-2">{order.barStatus}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.barStatus === 'pending' && (
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                    {order.barStatus === 'preparing' && (
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="bg-green-500 hover:bg-green-600 text-white transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Ready
                      </Button>
                    )}
                  </div>
                </div>
                {isDrinkItem(order.barItems[0].itemId) && (
                <p>This is a Bar item!</p>
              )}
              </CardContent>
            </Card>
          ))}
          
          {orders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-gray-500">
              <Beer className="w-16 h-16 mb-4 text-amber-400" />
              <p className="text-xl font-medium">No pending orders</p>
              <p className="text-sm">New drink orders will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}