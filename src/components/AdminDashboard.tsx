"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ClipboardList,
  User2,
  FileSpreadsheet,
  FileIcon as FilePdf,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react"
import LogoutButton from "./LogoutButton"
import autoTable from "jspdf-autotable"
import { jsPDF } from "jspdf"
import * as XLSX from "xlsx"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface Order {
  id: string
  tableNumber: number
  customerName: string
  kitchenStatus: string
  barStatus: string
  total: number
  createdAt: Date | null
}

interface UserData {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order | null
    direction: "ascending" | "descending"
  }>({ key: null, direction: "ascending" })

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      const data = snap.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }) as Order,
      )
      setOrders(data)
    }

    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"))
      const data = snap.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }) as UserData,
      )
      setUsers(data)
    }

    fetchOrders()
    fetchUsers()
  }, [])

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      orders.map((order) => ({
        Table: order.tableNumber,
        Customer: order.customerName,
        Total: order.total,
        KitchenStatus: order.kitchenStatus,
        BarStatus: order.barStatus,
        CreatedAt: order.createdAt?.toLocaleString(),
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")
    XLSX.writeFile(workbook, "orders_admin.xlsx")
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Orders Report", 14, 16)
    autoTable(doc, {
      head: [["Table", "Customer", "Total", "Kitchen", "Bar", "Created At"]],
      body: orders.map((order) => [
        order.tableNumber ?? "",
        order.customerName ?? "",
        order.total ? `Rp ${order.total.toLocaleString("id-ID")}` : "Rp0",
        order.kitchenStatus ?? "",
        order.barStatus ?? "",
        order.createdAt?.toLocaleString() ?? "",
      ]),
      startY: 20,
    })
    doc.save("orders_admin.pdf")
  }

  const requestSort = (key: keyof Order) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchTerm) ||
      order.kitchenStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.barStatus?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue === bValue) return 0

    if (sortConfig.direction === "ascending") {
      return (aValue ?? 0) < (bValue ?? 0) ? -1 : 1
    } else {
      return (aValue ?? 0) > (bValue ?? 0) ? -1 : 1
    }
  })

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your restaurant operations</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
              <FilePdf className="w-4 h-4" /> PDF
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                Total Orders
              </CardTitle>
              <CardDescription>All time orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{orders.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {orders.length > 0 ? `Last order: ${orders[0]?.createdAt?.toLocaleDateString()}` : "No orders yet"}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <User2 className="w-5 h-5 text-purple-500" />
                Total Users
              </CardTitle>
              <CardDescription>Registered accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {users.filter((u) => u.role === "admin").length} admins,{" "}
                {users.filter((u) => u.role === "staff").length} staff
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Total Revenue
              </CardTitle>
              <CardDescription>All time earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalRevenue.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {orders.length > 0
                  ? `Avg. ${(totalRevenue / orders.length).toLocaleString("id-ID", { style: "currency", currency: "IDR" })} per order`
                  : "No orders yet"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User2 className="w-4 h-4" /> Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" /> Order History
                </CardTitle>
                <CardDescription>View and manage all orders</CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search orders..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] w-full rounded-md">
                  <div className="w-full overflow-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                          <th
                            className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                            onClick={() => requestSort("tableNumber")}
                          >
                            <div className="flex items-center gap-1">
                              Table
                              {sortConfig.key === "tableNumber" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                            onClick={() => requestSort("customerName")}
                          >
                            <div className="flex items-center gap-1">
                              Customer
                              {sortConfig.key === "customerName" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                            onClick={() => requestSort("total")}
                          >
                            <div className="flex items-center gap-1">
                              Total
                              {sortConfig.key === "total" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                            onClick={() => requestSort("kitchenStatus")}
                          >
                            <div className="flex items-center gap-1">
                              Kitchen
                              {sortConfig.key === "kitchenStatus" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                            onClick={() => requestSort("barStatus")}
                          >
                            <div className="flex items-center gap-1">
                              Bar
                              {sortConfig.key === "barStatus" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                            onClick={() => requestSort("createdAt")}
                          >
                            <div className="flex items-center gap-1">
                              Created At
                              {sortConfig.key === "createdAt" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                ))}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedOrders.length > 0 ? (
                          sortedOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <td className="p-3 whitespace-nowrap">
                                <Badge variant="outline" className="font-medium">
                                  Table {order.tableNumber}
                                </Badge>
                              </td>
                              <td className="p-3">{order.customerName}</td>
                              <td className="p-3 font-medium">
                                {order.total !== undefined
                                  ? order.total.toLocaleString("id-ID", { style: "currency", currency: "IDR" })
                                  : "Rp0"}
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(order.kitchenStatus)}>{order.kitchenStatus}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(order.barStatus)}>{order.barStatus}</Badge>
                              </td>
                              <td className="p-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {order.createdAt?.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">
                              {searchTerm ? "No orders found matching your search" : "No orders available"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {sortedOrders.length} of {orders.length} orders
                </div>
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
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User2 className="w-5 h-5" /> User Management
                </CardTitle>
                <CardDescription>View and manage system users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{user.name || "Unnamed User"}</CardTitle>
                            <CardDescription className="text-xs truncate max-w-[200px]">{user.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Role</div>
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Joined</div>
                          <div className="text-sm">{user.createdAt?.toLocaleDateString() || "Unknown"}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
