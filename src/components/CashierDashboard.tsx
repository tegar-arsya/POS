"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlusCircle,
  MinusCircle,
  ClipboardList,
  Coffee,
  FileText,
  FileSpreadsheet,
  Search,
  ShoppingCart,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import LogoutButton from "./LogoutButton"
import { loadSnapScript, createSnapTransaction } from "@/lib/midtrans"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  paymentMethod: "cash" | "payment_gateway"
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
        },
      ) => void
    }
  }
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tableNumber, setTableNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedItem, setSelectedItem] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "payment_gateway">("cash")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchMenuItems = async () => {
      const menuSnapshot = await getDocs(collection(db, "menu"))
      const menuData = menuSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as MenuItem,
      )
      setMenuItems(menuData)
    }
    fetchMenuItems()

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }) as Order,
      )
      setOrders(ordersData)
    })

    // Load Midtrans Snap script
    const loadMidtrans = async () => {
      try {
        await loadSnapScript()
      } catch (error) {
        console.error("Failed to load Midtrans Snap:", error)
      }
    }
    loadMidtrans()

    return () => unsubscribe()
  }, [])

  const addItemToOrder = () => {
    if (selectedItem && quantity) {
      const menuItem = menuItems.find((item) => item.id === selectedItem)
      if (menuItem) {
        setCurrentOrder([
          ...currentOrder,
          {
            itemId: menuItem.id,
            name: menuItem.name,
            quantity: Number.parseInt(quantity),
            notes: notes,
            price: menuItem.price,
          },
        ])
        setSelectedItem("")
        setQuantity("1")
        setNotes("")
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
        await loadSnapScript()
      }

      setIsProcessingPayment(true)
      const midtransOrderId = `ORDER-${orderId}-${Date.now()}`
      const transactionData = {
        transaction_details: {
          order_id: midtransOrderId, // Format: ORDER-{firebaseId}-{timestamp}
          gross_amount: total,
        },
        customer_details: {
          first_name: customerName || "Customer",
        },
        item_details: currentOrder.map((item) => ({
          id: item.itemId,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        })),
        callbacks: {
          finish: `/payment/success?order_id=${orderId}`,
        },
      }

      const response = await createSnapTransaction(transactionData)

      window.snap.pay(response.token, {
        onSuccess: async (result) => {
          console.log("Payment success:", result)
          // Update status secara lokal sebagai fallback
          await updateDoc(doc(db, "orders", orderId), {
            midtransOrderId,
            paymentStatus: "paid",
            updatedAt: new Date(),
          })
          router.push(`/payment/success?order_id=${orderId}`)
        },
        onPending: (result) => {
          console.log("Payment pending:", result)
          alert("Payment pending. Please complete the payment.")
        },
        onError: (result) => {
          console.log("Payment error:", result)
          alert("Payment failed. Please try again.")
        },
        onClose: () => {
          console.log("Payment popup closed")
        },
      })
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment processing failed. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentOrder.length === 0) {
      alert("Please add at least one item to the order")
      return
    }

    const kitchenItems = currentOrder.filter((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.itemId)
      return (
        menuItem &&
        menuItem.category !== "Hot Drink" &&
        menuItem.category !== "Cold Drink" &&
        menuItem.category !== "Minuman"
      )
    })
    const barItems = currentOrder.filter((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.itemId)
      return (
        menuItem &&
        (menuItem.category === "Hot Drink" || menuItem.category === "Cold Drink" || menuItem.category === "Minuman")
      )
    })

    const total = calculateTotal()

    const orderData = {
      tableNumber: Number.parseInt(tableNumber),
      customerName,
      kitchenItems,
      barItems,
      kitchenStatus: kitchenItems.length > 0 ? "pending" : "not required",
      barStatus: barItems.length > 0 ? "pending" : "not required",
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "paid" : "pending",
      createdAt: new Date(),
    }
    setIsProcessingPayment(true)
    try {
      const docRef = await addDoc(collection(db, "orders"), orderData)

      if (paymentMethod === "payment_gateway") {
        await handlePaymentGateway(docRef.id, total)
      } else {
        alert(`Order submitted successfully for table ${tableNumber}`)
      }

      // Reset form
      setTableNumber("")
      setCustomerName("")
      setCurrentOrder([])
    } catch (error) {
      console.error("Error submitting order:", error)
      alert("Failed to submit order. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      orders.map((order) => ({
        Table: order.tableNumber,
        Customer: order.customerName,
        Total: order.total,
        "Payment Method": order.paymentMethod,
        "Payment Status": order.paymentStatus,
        "Kitchen Status": order.kitchenStatus,
        "Bar Status": order.barStatus,
        "Created At": order.createdAt ? order.createdAt.toLocaleString() : "Invalid Date",
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")
    XLSX.writeFile(workbook, "orders.xlsx")
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Orders Report", 14, 16)

    const tableData = orders.map((order) => [
      order.tableNumber,
      order.customerName,
      `Rp ${order.total.toLocaleString()}`,
      order.paymentMethod,
      order.paymentStatus,
      order.kitchenStatus,
      order.barStatus,
      order.createdAt ? order.createdAt.toLocaleString() : "Invalid Date",
    ])

    autoTable(doc, {
      head: [["Table", "Customer", "Total", "Payment", "Status", "Kitchen", "Bar", "Created At"]],
      body: tableData,
      startY: 20,
    })

    doc.save("orders.pdf")
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>
      case "preparing":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{status}</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{status}</Badge>
      case "not required":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{status}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchTerm) ||
      order.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <Coffee className="w-8 h-8 mr-3 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cashier Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> PDF
            </Button>
            <Link href="/menu" passHref>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">Tambah Menu</Button>
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-md border-t-4 border-t-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-xl">
                  <ShoppingCart className="w-5 h-5 mr-2 text-amber-500" />
                  New Order
                </CardTitle>
                <CardDescription>Create a new customer order</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="tableNumber" className="text-sm font-medium">
                        Table Number
                      </label>
                      <Input
                        id="tableNumber"
                        placeholder="Table Number"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="border-2 focus-visible:ring-amber-500"
                        required
                        type="number"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="customerName" className="text-sm font-medium">
                        Customer Name
                      </label>
                      <Input
                        id="customerName"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="border-2 focus-visible:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="menuItem" className="text-sm font-medium">
                      Menu Item
                    </label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger id="menuItem" className="border-2">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - Rp {item.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="text-sm font-medium">
                        Quantity
                      </label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="notes" className="text-sm font-medium">
                        Special Instructions
                      </label>
                      <Textarea
                        id="notes"
                        placeholder="Special instructions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="border-2"
                      />
                    </div>
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center">
                        <ClipboardList className="w-5 h-5 mr-2 text-amber-500" />
                        Current Order
                      </h3>
                      <Badge variant="outline" className="font-medium">
                        {currentOrder.length} items
                      </Badge>
                    </div>

                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      {currentOrder.length > 0 ? (
                        <div className="space-y-2">
                          {currentOrder.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <span className="font-medium truncate">{item.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    x{item.quantity}
                                  </Badge>
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                    Note: {item.notes}
                                  </p>
                                )}
                                <p className="text-sm font-semibold mt-1">
                                  Rp {(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeItemFromOrder(index)}
                                className="ml-2 h-8 w-8 p-0"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 py-8">
                          <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                          <p>No items in current order</p>
                        </div>
                      )}
                    </ScrollArea>

                    {currentOrder.length > 0 && (
                      <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg font-semibold border border-amber-200 dark:border-amber-800">
                        <span>Total</span>
                        <span>Rp {calculateTotal().toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="paymentMethod" className="text-sm font-medium">
                      Payment Method
                    </label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(val: "cash" | "payment_gateway") => setPaymentMethod(val)}
                    >
                      <SelectTrigger id="paymentMethod" className="border-2">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={currentOrder.length === 0 || isProcessingPayment}
                    className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    {isProcessingPayment ? (
                      <span className="flex items-center justify-center">Processing Payment...</span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Submit Order
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-amber-500" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription>View and manage recent customer orders</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search orders..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table">
                  <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Card View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Table</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Kitchen</TableHead>
                            <TableHead>Bar</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                  <Badge variant="outline">Table {order.tableNumber}</Badge>
                                </TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell className="font-medium">
                                  {order.total !== undefined
                                    ? order.total.toLocaleString("id-ID", { style: "currency", currency: "IDR" })
                                    : "Rp0"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className="w-fit">
                                      {order.paymentMethod === "cash" ? "Cash" : "Gateway"}
                                    </Badge>
                                    {getPaymentStatusBadge(order.paymentStatus)}
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(order.kitchenStatus)}</TableCell>
                                <TableCell>{getStatusBadge(order.barStatus)}</TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {order.createdAt?.toLocaleTimeString()}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                {searchTerm ? "No orders found matching your search" : "No orders available"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="cards">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <Badge variant="outline" className="font-medium">
                                  Table {order.tableNumber}
                                </Badge>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.createdAt ? order.createdAt.toLocaleString() : "Invalid Date"}
                                </span>
                              </div>
                              <CardTitle className="text-base mt-2">{order.customerName}</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">
                                    {order.paymentMethod === "cash" ? "Cash" : "Payment Gateway"}
                                  </Badge>
                                  {getPaymentStatusBadge(order.paymentStatus)}
                                  {getStatusBadge(order.kitchenStatus)}
                                  {getStatusBadge(order.barStatus)}
                                </div>

                                <Separator />

                                <div className="space-y-1 text-sm">
                                  {order.kitchenItems?.length > 0 && (
                                    <>
                                      <p className="font-medium">Kitchen Items:</p>
                                      {order.kitchenItems.map((item, index) => (
                                        <p key={`kitchen-${index}`} className="pl-2 text-gray-600 dark:text-gray-300">
                                          {item.quantity}x {item.name}
                                        </p>
                                      ))}
                                    </>
                                  )}

                                  {order.barItems?.length > 0 && (
                                    <>
                                      <p className="font-medium mt-2">Bar Items:</p>
                                      {order.barItems.map((item, index) => (
                                        <p key={`bar-${index}`} className="pl-2 text-gray-600 dark:text-gray-300">
                                          {item.quantity}x {item.name}
                                        </p>
                                      ))}
                                    </>
                                  )}
                                </div>

                                <div className="flex justify-between items-center pt-2 font-medium">
                                  <span>Total:</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {order.total !== undefined
                                      ? order.total.toLocaleString("id-ID", { style: "currency", currency: "IDR" })
                                      : "Rp0"}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                          <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                          <p>{searchTerm ? "No orders found matching your search" : "No orders available"}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <p className="text-sm text-gray-500">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    Export to Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    Export to PDF
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
