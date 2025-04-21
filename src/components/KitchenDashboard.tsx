"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Timer,
  Utensils,
  AlertCircle,
  User,
  RefreshCcw,
  ChevronDown,
  Search,
  Filter,
  Pizza,
  Sandwich,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import LogoutButton from "./LogoutButton"


interface OrderItem {
  itemId: string
  name: string
  quantity: number
  notes: string
}

interface Order {
  id: string
  tableNumber: number
  customerName: string
  kitchenItems: OrderItem[]
  kitchenStatus: string
  createdAt: Date | null
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  // Removed unused menuItems state
  const [filter, setFilter] = useState<"all" | "pending" | "preparing">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Removed unused fetchMenuItems logic

    // Query for orders with kitchenStatus of pending or preparing
    const q = query(
      collection(db, "orders"),
      where("kitchenStatus", "in", ["pending", "preparing"]),
      orderBy("createdAt", "asc"),
    )

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

    return () => unsubscribe()
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { kitchenStatus: newStatus })
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        )
      case "preparing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">
            <Timer className="w-4 h-4 mr-1" />
            Preparing
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Ready
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            <AlertCircle className="w-4 h-4 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const getFoodIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("pizza") || lowerName.includes("pie")) {
      return <Pizza className="w-4 h-4 text-red-600" />
    } else if (lowerName.includes("sandwich") || lowerName.includes("burger")) {
      return <Sandwich className="w-4 h-4 text-amber-600" />
    }
    return <Utensils className="w-4 h-4 text-emerald-600" />
  }

  const getTimeAgo = (date: Date | null) => {
    if (!date) return "Unknown time"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins === 1) return "1 minute ago"
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return "1 hour ago"
    if (diffHours < 24) return `${diffHours} hours ago`

    return date.toLocaleString()
  }

  // Filter orders based on status and search term
  const filteredOrders = orders.filter((order) => {
    // First apply status filter
    if (filter !== "all" && order.kitchenStatus !== filter) {
      return false
    }

    // Then apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.customerName.toLowerCase().includes(searchLower) ||
        order.tableNumber.toString().includes(searchLower) ||
        order.kitchenItems.some((item) => item.name.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  // Count orders by status
  const pendingCount = orders.filter((order) => order.kitchenStatus === "pending").length
  const preparingCount = orders.filter((order) => order.kitchenStatus === "preparing").length

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center">
            <ChefHat className="w-8 h-8 mr-3 text-emerald-600 dark:text-emerald-500" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Kitchen Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={refreshOrders} className={refreshing ? "animate-spin" : ""}>
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Manage kitchen orders and update their status</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search orders..."
                      className="pl-8 w-full sm:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFilter("all")}>All Orders</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("pending")}>Pending Orders</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("preparing")}>Preparing Orders</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="grid" className="w-full">
                <div className="px-6 pt-2 border-b">
                  <TabsList>
                    <TabsTrigger value="grid">Grid View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="grid" className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <Card
                          key={order.id}
                          className={`overflow-hidden border-l-4 hover:shadow-md transition-shadow ${
                            order.kitchenStatus === "pending"
                              ? "border-l-yellow-500"
                              : order.kitchenStatus === "preparing"
                                ? "border-l-blue-500"
                                : "border-l-green-500"
                          }`}
                        >
                          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-b p-4">
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="font-medium">
                                Table {order.tableNumber}
                              </Badge>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {getTimeAgo(order.createdAt)}
                              </div>
                            </div>
                            <CardTitle className="text-base mt-2 flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              {order.customerName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Items</div>
                              {getStatusBadge(order.kitchenStatus)}
                            </div>
                            <ScrollArea className="h-[120px] rounded-md">
                              <div className="space-y-2">
                                {order.kitchenItems &&
                                  order.kitchenItems.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-gray-700"
                                    >
                                      <div className="flex items-center">
                                        {getFoodIcon(item.name)}
                                        <div className="ml-2">
                                          <div className="font-medium text-gray-800 dark:text-gray-200">
                                            {item.quantity}x {item.name}
                                          </div>
                                          {item.notes && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Note: {item.notes}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                          <CardFooter className="border-t p-4 flex justify-end gap-2 bg-gray-50 dark:bg-gray-800">
                            {order.kitchenStatus === "pending" && (
                              <Button
                                onClick={() => updateOrderStatus(order.id, "preparing")}
                                className="bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                              >
                                <Timer className="w-4 h-4 mr-2" />
                                Start Preparing
                              </Button>
                            )}
                            {order.kitchenStatus === "preparing" && (
                              <Button
                                onClick={() => updateOrderStatus(order.id, "ready")}
                                className="bg-green-500 hover:bg-green-600 text-white transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark as Ready
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border">
                        <ChefHat className="w-16 h-16 mb-4 text-emerald-400 opacity-50" />
                        <p className="text-xl font-medium">No orders found</p>
                        <p className="text-sm mt-1">
                          {searchTerm
                            ? "Try adjusting your search or filters"
                            : filter !== "all"
                              ? `No ${filter} orders at the moment`
                              : "New food orders will appear here"}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="p-0">
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 p-4 font-medium text-sm bg-gray-50 dark:bg-gray-800 border-b">
                      <div className="col-span-1">Table</div>
                      <div className="col-span-2">Customer</div>
                      <div className="col-span-3">Items</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Time</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <ScrollArea className="h-[500px]">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <div
                            key={order.id}
                            className="grid grid-cols-12 gap-2 p-4 items-center border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <div className="col-span-1">
                              <Badge variant="outline">{order.tableNumber}</Badge>
                            </div>
                            <div className="col-span-2 font-medium truncate">{order.customerName}</div>
                            <div className="col-span-3">
                              <div className="flex flex-col gap-1">
                                {order.kitchenItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center text-sm">
                                    {getFoodIcon(item.name)}
                                    <span className="ml-1 truncate">
                                      {item.quantity}x {item.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="col-span-2">{getStatusBadge(order.kitchenStatus)}</div>
                            <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                              {getTimeAgo(order.createdAt)}
                            </div>
                            <div className="col-span-2 flex justify-end gap-2">
                              {order.kitchenStatus === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, "preparing")}
                                  className="bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                >
                                  <Timer className="w-3 h-3 mr-1" />
                                  Start
                                </Button>
                              )}
                              {order.kitchenStatus === "preparing" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, "ready")}
                                  className="bg-green-500 hover:bg-green-600 text-white transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Ready
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
                          <ChefHat className="w-16 h-16 mb-4 text-emerald-400 opacity-50" />
                          <p className="text-xl font-medium">No orders found</p>
                          <p className="text-sm mt-1">
                            {searchTerm
                              ? "Try adjusting your search or filters"
                              : filter !== "all"
                                ? `No ${filter} orders at the moment`
                                : "New food orders will appear here"}
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                Pending Orders
              </CardTitle>
              <CardDescription>Orders waiting to be prepared</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Timer className="w-5 h-5 mr-2 text-blue-500" />
                Preparing
              </CardTitle>
              <CardDescription>Orders currently in preparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{preparingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-emerald-500" />
                Total Orders
              </CardTitle>
              <CardDescription>All active kitchen orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
