'use client'
import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, MinusCircle, ClipboardList, Coffee } from 'lucide-react'
import Link from 'next/link'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import LogoutButton from './LogoutButton'
interface MenuItem {
  id: string
  name: string
  category: string
  price: number
}

interface OrderItem {
  itemId: string
  name: string
  quantity: number
  notes: string
  price: number
}

interface Order {
  id: string
  tableNumber: number
  customerName: string
  kitchenItems: OrderItem[]
  barItems: OrderItem[]
  kitchenStatus: string
  barStatus: string
  createdAt: Date | null
  total: number
  
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  

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

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as Order))
      setOrders(ordersData)
    })
    return () => unsubscribe()
  }, [])

  const addItemToOrder = () => {
    if (selectedItem && quantity) {
      const menuItem = menuItems.find(item => item.id === selectedItem)
      if (menuItem) {
        setCurrentOrder([...currentOrder, {
          itemId: menuItem.id,
          name: menuItem.name,
          quantity: parseInt(quantity),
          notes: notes,
          // price: menuItem.price * parseInt(quantity),
          price: menuItem.price
        }])
        setSelectedItem('')
        setQuantity('1')
        setNotes('')
      }
    }
  }

  const removeItemFromOrder = (index: number) => {
    setCurrentOrder(currentOrder.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentOrder.length > 0) {
      const kitchenItems = currentOrder.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.itemId)
        return menuItem && menuItem.category !== 'Hot Drink' && menuItem.category !== 'Cold Drink' && menuItem.category !== 'Minuman' 
      })
      const barItems = currentOrder.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.itemId)
        return menuItem && (menuItem.category === 'Hot Drink' || menuItem.category === 'Cold Drink' || menuItem.category === 'Minuman')
      })
      // Hitung total harga
    const total = currentOrder.reduce((acc, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.itemId)
      return acc + (menuItem ? menuItem.price * item.quantity : 0)
    }, 0)
      await addDoc(collection(db, 'orders'), {
        tableNumber: parseInt(tableNumber),
        customerName: customerName,
        kitchenItems,
        barItems,
        kitchenStatus: kitchenItems.length > 0 ? 'pending' : 'not required',
        barStatus: barItems.length > 0 ? 'pending' : 'not required',
        total: total,
        createdAt: new Date()
      })
      setTableNumber('')
      setCurrentOrder([])
    }
  }
  const calculateTotal = () => {
    return currentOrder.reduce((total, item) => total + item.price * item.quantity, 0)
  }
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
      Table: order.tableNumber,
      Customer: order.customerName,
      Total: order.total,
      "Kitchen Status": order.kitchenStatus,
      "Bar Status": order.barStatus,
      "Created At": order.createdAt ? order.createdAt.toLocaleString() : "Invalid Date",
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
    XLSX.writeFile(workbook, 'orders.xlsx')
  }
  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Orders Report", 14, 16)

    const tableData = orders.map(order => [
      order.tableNumber,
      order.customerName,
      order.total,
      order.kitchenStatus,
      order.barStatus,
      order.createdAt ? order.createdAt.toLocaleString() : "Invalid Date"
    ])
    autoTable(doc, {
      head: [["Table", "Customer", "Kitchen Status", "Bar Status", "Created At"]],
      body: tableData,
      startY: 20,
    })

    doc.save("orders.pdf")
  }
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tombol untuk Ekspor */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={exportToExcel}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Export to Excel
          </Button>
          <Button
            onClick={exportToPDF}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Export to PDF
          </Button>
          <LogoutButton />
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8 animate-fade-in-down">
          <Coffee className="w-8 h-8 mr-3 text-amber-600" />
          <h1 className="text-4xl font-bold text-gray-800">Cashier Dashboard</h1>
          <Link
            href="/menu"
            className="ml-auto text-white hover:text-amber-800 transition-colors duration-300 bg-red-500 px-4 py-2 rounded-md"
          >
            Tambah Menu
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-lg animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2" />
                  New Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Table Number"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="border-2 focus:ring-2 focus:ring-amber-500"
                      required
                    />
                     <Input
                      placeholder="Nama Pembeli"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="border-2 focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="border-2"
                    />
                    <Textarea
                      placeholder="Special instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="border-2"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addItemToOrder}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <ClipboardList className="w-5 h-5 mr-2" />
                      Current Order
                    </h2>
                    {currentOrder.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-slide-in">
                        <span className="font-medium">
                          {item.quantity}x {item.name}
                          {item.notes && <span className="text-sm text-gray-500 ml-2">({item.notes})</span>}
                        </span>
                        <Button
                          variant="destructive"
                          onClick={() => removeItemFromOrder(index)}
                          className="hover:bg-red-600 transition-colors"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg font-semibold">
          <span>Total</span>
          <span>Rp {calculateTotal().toLocaleString()}</span>
        </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={currentOrder.length === 0}
                    className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    Submit Order
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Orders</h2>
            <div className="space-y-4">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <Card key={order.id} className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Table {order.tableNumber}</span>
                        <span className="text-sm font-normal text-gray-500">
                        {order.createdAt ? order.createdAt.toLocaleString() : 'Invalid Date'}
                        </span>
                      </CardTitle>
                      <CardTitle className="flex justify-between items-center">
                        <span>customerName : {order.customerName}</span>
                        <span className="text-sm font-normal text-gray-500">
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {order.kitchenItems?.map((item, index) => (
                        <p key={`kitchen-${index}`} className="text-sm mb-1">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                      {order.barItems?.map((item, index) => (
                        <p key={`bar-${index}`} className="text-sm mb-1">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                      <CardTitle className="flex justify-end items-center">
                        <span>Total : Rp {order.total}</span>
                        <span className="text-sm font-normal text-gray-500">
                        </span>
                      </CardTitle>
                      <div className="mt-3 flex gap-2">
                        <span className={`status-badge ${order.kitchenStatus === 'pending' ? 'status-pending' : order.kitchenStatus === 'preparing' ? 'status-preparing' : 'status-ready'}`}>
                          Kitchen: {order.kitchenStatus}
                        </span>
                        <span className={`status-badge ${order.barStatus === 'pending' ? 'status-pending' : order.barStatus === 'preparing' ? 'status-preparing' : 'status-ready'}`}>
                          Bar: {order.barStatus}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No orders found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

