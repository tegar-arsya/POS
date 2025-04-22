"use client"

import { useEffect, useState, Suspense } from "react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Clock, Receipt, CreditCard, Home, ArrowLeft, RefreshCcw } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Order {
  id: string
  paymentStatus: string
  total: number
  paymentMethod: string
  midtransOrderId?: string
  customerName?: string
  tableNumber?: number
  createdAt?: Date
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const midtransOrderId = searchParams.get("order_id")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [progress, setProgress] = useState(20)

  useEffect(() => {
    let pollingTimeout: NodeJS.Timeout

    const fetchOrder = async () => {
      try {
        if (!midtransOrderId) {
          setError("Order ID parameter is missing")
          setLoading(false)
          return
        }

        // Update progress bar
        setProgress(Math.min(20 + retryCount * 20, 90))

        const ordersRef = collection(db, "orders")
        const fullMidtransId = `ORDER-${midtransOrderId}-` // pakai startsWith match
        const q = query(
          ordersRef,
          where("midtransOrderId", ">=", fullMidtransId),
          where("midtransOrderId", "<", fullMidtransId + "\uf8ff"),
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0]
          const fetchedOrder: Order = {
            id: orderDoc.id,
            paymentStatus: orderDoc.data().paymentStatus,
            total: orderDoc.data().total,
            paymentMethod: orderDoc.data().paymentMethod,
            customerName: orderDoc.data().customerName,
            tableNumber: orderDoc.data().tableNumber,
            createdAt: orderDoc.data().createdAt?.toDate(),
            ...orderDoc.data(),
          }
          setOrder(fetchedOrder)

          // Stop polling if sudah "paid"
          if (fetchedOrder.paymentStatus === "paid" || retryCount >= 5) {
            setLoading(false)
            setProgress(100)
            return
          }
        } else {
          // Fallback: ekstrak Firebase ID dari order_id
          const firebaseId = midtransOrderId.split("-")[1]
          const orderRef = doc(db, "orders", firebaseId)
          const orderSnap = await getDoc(orderRef)

          if (orderSnap.exists()) {
            const fallbackOrder: Order = {
              id: orderSnap.id,
              paymentStatus: orderSnap.data().paymentStatus,
              total: orderSnap.data().total,
              paymentMethod: orderSnap.data().paymentMethod,
              customerName: orderSnap.data().customerName,
              tableNumber: orderSnap.data().tableNumber,
              createdAt: orderSnap.data().createdAt?.toDate(),
              ...orderSnap.data(),
            }
            setOrder(fallbackOrder)
            if (fallbackOrder.paymentStatus === "paid" || retryCount >= 5) {
              setLoading(false)
              setProgress(100)
              return
            }
          } else {
            setError("Order not found in database")
            setLoading(false)
            return
          }
        }

        // Retry polling kalau belum "paid"
        if (retryCount < 5) {
          setRetryCount(retryCount + 1)
          pollingTimeout = setTimeout(fetchOrder, 2000) // 2 detik
        } else {
          setLoading(false)
          setProgress(100)
        }
      } catch (err) {
        console.error("Error fetching order:", err)
        setError("Failed to load order details")
        setLoading(false)
      }
    }

    fetchOrder()

    return () => clearTimeout(pollingTimeout)
  }, [midtransOrderId, retryCount])

  const handleRefresh = () => {
    setRetryCount(0)
    setLoading(true)
    setProgress(20)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verifying Payment</CardTitle>
            <CardDescription>Please wait while we confirm your payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
                <Clock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 h-6 w-6" />
              </div>
            </div>
            <Progress value={progress} className="h-2 w-full" />
            <p className="text-center text-sm text-gray-500">Checking payment status... ({Math.round(progress)}%)</p>
            {retryCount > 0 && <p className="text-center text-xs text-gray-400">Attempt {retryCount} of 5</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-red-600">Order Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-gray-500 mb-4">Order ID: {midtransOrderId}</p>
            <p className="text-center text-sm text-gray-500">
              We couldnt find your order details. Please try again or contact customer support.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => router.push("/orders")} className="w-full">
              View My Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {order.paymentStatus === "paid" ? (
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="rounded-full bg-yellow-100 p-3 animate-pulse">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl">
            {order.paymentStatus === "paid" ? "Payment Successful!" : "Waiting for Payment Confirmation"}
          </CardTitle>
          <CardDescription>
            {order.paymentStatus === "paid"
              ? "Your order has been confirmed and is being processed"
              : "We're waiting for your payment to be confirmed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.customerName && order.tableNumber && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer:</span>
                <span className="text-sm">{order.customerName}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-medium">Table:</span>
                <Badge variant="outline">{order.tableNumber}</Badge>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <Receipt className="h-4 w-4 mr-1" />
              Order Details
            </h3>
            <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg border p-3">
              <div className="flex justify-between">
                <span className="text-sm">Order ID:</span>
                <span className="text-sm font-mono">{order.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Status:</span>
                <Badge
                  className={
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  }
                >
                  {order.paymentStatus === "paid" ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : (
                    <Clock className="mr-1 h-3 w-3" />
                  )}
                  {order.paymentStatus?.toUpperCase()}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Payment Method:</span>
                <div className="flex items-center">
                  <CreditCard className="h-3 w-3 mr-1 text-gray-500" />
                  <span className="text-sm">
                    {order.paymentMethod === "payment_gateway" ? "Payment Gateway" : "Cash"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Amount:</span>
                <span className="text-lg font-bold">Rp {order.total?.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {order.paymentStatus !== "paid" && (
            <div className="text-center text-sm text-gray-500">
              <p>If you have already completed the payment, please wait a moment while we verify the transaction.</p>
              <Button onClick={handleRefresh} variant="ghost" size="sm" className="mt-2">
                <RefreshCcw className="mr-1 h-3 w-3" />
                Refresh Status
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-1/2" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Link href="/cashier" className="w-full sm:w-1/2">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
