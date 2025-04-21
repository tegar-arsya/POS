'use client'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, User2, FileSpreadsheet } from 'lucide-react'
import LogoutButton from './LogoutButton'
import autoTable from 'jspdf-autotable'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

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

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Order))
      setOrders(data)
    }

    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'))
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as UserData))
      setUsers(data)
    }

    fetchOrders()
    fetchUsers()
  }, [])

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
      Table: order.tableNumber,
      Customer: order.customerName,
      Total: order.total,
      KitchenStatus: order.kitchenStatus,
      BarStatus: order.barStatus,
      CreatedAt: order.createdAt?.toLocaleString()
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
    XLSX.writeFile(workbook, 'orders_admin.xlsx')
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Orders Report", 14, 16)
    autoTable(doc, {
      head: [["Table", "Customer", "Total", "Kitchen", "Bar", "Created At"]],
      body: orders.map(order => [
        order.tableNumber ?? '',
        order.customerName ?? '',
        order.total ?? '',
        order.kitchenStatus ?? '',
        order.barStatus ?? '',
        order.createdAt?.toLocaleString() ?? ''
      ]),
      startY: 20
    })
    doc.save("orders_admin.pdf")
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <Button onClick={exportToExcel} className="bg-blue-500 text-white">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button onClick={exportToPDF} className="bg-red-500 text-white">
            PDF
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>{orders.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>{users.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            Rp {orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('id-ID')}
          </CardContent>
        </Card>
      </div>

      {/* Data User */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle><User2 className="inline w-5 h-5 mr-2" /> Data Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} className="p-4 border rounded shadow-sm">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Order */}
      <Card>
        <CardHeader>
          <CardTitle><ClipboardList className="inline w-5 h-5 mr-2" /> Riwayat Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Table</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Kitchen</th>
                <th>Bar</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t">
                  <td className="p-2">{order.tableNumber}</td>
                  <td>{order.customerName}</td>
                  <td>
  {order.total !== undefined
    ? order.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
    : 'Rp0'}
</td>

                  <td>{order.kitchenStatus}</td>
                  <td>{order.barStatus}</td>
                  <td>{order.createdAt?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
