'use client'
import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
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
import { loadSnapScript, createSnapTransaction } from '@/lib/midtrans'
import { useRouter } from 'next/navigation'

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
  paymentMethod: 'cash' | 'payment_gateway'
  paymentStatus: string
}

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: { transaction_id: string; status_code: string; gross_amount: string }) => void
          onPending?: (result: { transaction_id: string; status_code: string; gross_amount: string }) => void
          onError?: (result: { message: string; code?: string }) => void
          onClose?: () => void
        }
      ) => void
    }
  }
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'payment_gateway'>('cash')
  // Removed unused isSnapLoaded state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const router = useRouter()
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

    // Load Midtrans Snap script
    const loadMidtrans = async () => {
      try {
        await loadSnapScript()
        // Removed unused setIsSnapLoaded call
      } catch (error) {
        console.error('Failed to load Midtrans Snap:', error)
      }
    }
    loadMidtrans()

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

  const calculateTotal = () => {
    return currentOrder.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handlePaymentGateway = async (orderId: string, total: number) => {
    try {
      if (!window.snap) {
        await loadSnapScript();
      }
  
      setIsProcessingPayment(true);
      const midtransOrderId = `ORDER-${orderId}-${Date.now()}`;
      const transactionData = {
        transaction_details: {
          order_id: midtransOrderId, // Format: ORDER-{firebaseId}-{timestamp}
          gross_amount: total,
        },
        customer_details: {
          first_name: customerName || 'Customer',
        },
        item_details: currentOrder.map(item => ({
          id: item.itemId,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        })),
        callbacks: {
          finish: `/payment/success?order_id=${orderId}`,
        }
      };
  
      const response = await createSnapTransaction(transactionData);
      
      window.snap.pay(response.token, {
        onSuccess: async (result) => {
          console.log('Payment success:', result);
          // Update status secara lokal sebagai fallback
          await updateDoc(doc(db, 'orders', orderId), {
            midtransOrderId,
            paymentStatus: 'paid',
            updatedAt: new Date()
          });
          router.push(`/payment/success?order_id=${orderId}`);
        },
        onPending: (result) => {
          
          console.log('Payment pending:', result);
          alert('Payment pending. Please complete the payment.');
        },
        onError: (result) => {
          console.log('Payment error:', result);
          alert('Payment failed. Please try again.');
        },
        onClose: () => {
          console.log('Payment popup closed');
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentOrder.length === 0) {
      alert('Please add at least one item to the order')
      return
    }

    const kitchenItems = currentOrder.filter(item => {
      const menuItem = menuItems.find(mi => mi.id === item.itemId)
      return menuItem && menuItem.category !== 'Hot Drink' && menuItem.category !== 'Cold Drink' && menuItem.category !== 'Minuman'
    })
    const barItems = currentOrder.filter(item => {
      const menuItem = menuItems.find(mi => mi.id === item.itemId)
      return menuItem && (menuItem.category === 'Hot Drink' || menuItem.category === 'Cold Drink' || menuItem.category === 'Minuman')
    })

    const total = calculateTotal()

    const orderData = {
      tableNumber: parseInt(tableNumber),
      customerName,
      kitchenItems,
      barItems,
      kitchenStatus: kitchenItems.length > 0 ? 'pending' : 'not required',
      barStatus: barItems.length > 0 ? 'pending' : 'not required',
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
      createdAt: new Date()
    }
    setIsProcessingPayment(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData)

      if (paymentMethod === 'payment_gateway') {
        await handlePaymentGateway(docRef.id, total)
      } else {
        alert(`Order submitted successfully for table ${tableNumber}`)
      }

      // Reset form
      setTableNumber('')
      setCustomerName('')
      setCurrentOrder([])
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    }
    finally {
      setIsProcessingPayment(false);
    }
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
      Table: order.tableNumber,
      Customer: order.customerName,
      Total: order.total,
      "Payment Method": order.paymentMethod,
      "Payment Status": order.paymentStatus,
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
      `Rp ${order.total.toLocaleString()}`,
      order.paymentMethod,
      order.paymentStatus,
      order.kitchenStatus,
      order.barStatus,
      order.createdAt ? order.createdAt.toLocaleString() : "Invalid Date"
    ])
    
    autoTable(doc, {
      head: [["Table", "Customer", "Total", "Payment", "Status", "Kitchen", "Bar", "Created At"]],
      body: tableData,
      startY: 20,
    })

    doc.save("orders.pdf")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Export and Logout Buttons */}
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
                      type="number"
                      min="1"
                    />
                    <Input
                      placeholder="Customer Name"
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
                    disabled={!selectedItem}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <ClipboardList className="w-5 h-5 mr-2" />
                      Current Order
                    </h2>
                    {currentOrder.length > 0 ? (
                      <>
                        {currentOrder.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-slide-in">
                            <div>
                              <span className="font-medium">
                                {item.quantity}x {item.name}
                              </span>
                              {item.notes && (
                                <p className="text-sm text-gray-500 mt-1">Note: {item.notes}</p>
                              )}
                              <p className="text-sm font-semibold mt-1">
                                Rp {(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
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
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No items in current order</p>
                    )}
                  </div>

                  <Select 
                    value={paymentMethod} 
                    onValueChange={(val: 'cash' | 'payment_gateway') => setPaymentMethod(val)}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    disabled={currentOrder.length === 0 || isProcessingPayment}
                    className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    {isProcessingPayment ? (
                      <span className="flex items-center justify-center">
                        Processing Payment...
                      </span>
                    ) : (
                      <span>Submit Order</span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Orders</h2>
            <div className="space-y-4">
              {orders.length > 0 ? (
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
                        <span>Customer: {order.customerName}</span>
                        <span className={`text-sm font-semibold ${
                          order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {order.paymentMethod === 'cash' ? 'Cash' : 'Payment Gateway'} - {order.paymentStatus}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {order.kitchenItems?.map((item, index) => (
                        <p key={`kitchen-${index}`} className="text-sm mb-1">
                          {item.quantity}x {item.name} (Rp {(item.price * item.quantity).toLocaleString()})
                        </p>
                      ))}
                      {order.barItems?.map((item, index) => (
                        <p key={`bar-${index}`} className="text-sm mb-1">
                          {item.quantity}x {item.name} (Rp {(item.price * item.quantity).toLocaleString()})
                        </p>
                      ))}
                      <div className="mt-3 flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold">Rp {order.total}</span>
                      </div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.kitchenStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.kitchenStatus === 'preparing' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          Kitchen: {order.kitchenStatus}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.barStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.barStatus === 'preparing' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
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