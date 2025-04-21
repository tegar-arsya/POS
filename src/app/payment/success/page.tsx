'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase'
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';



export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const midtransOrderId = searchParams.get('order_id');
  interface Order {
    id: string
    paymentStatus: string
    total: number
    paymentMethod: string
  }

  const [order, setOrder] = useState<Order[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!midtransOrderId) {
          setError('Order ID parameter is missing');
          setLoading(false);
          return;
        }

        console.log('Searching for order with midtransOrderId:', midtransOrderId);

        // 1. Cari berdasarkan midtransOrderId terlebih dahulu
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('midtransOrderId', '==', midtransOrderId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          console.log('Found order by midtransOrderId:', orderDoc.id);
          setOrder([ { 
            id: orderDoc.id, 
            paymentStatus: orderDoc.data().paymentStatus, 
            total: orderDoc.data().total, 
            paymentMethod: orderDoc.data().paymentMethod, 
            ...orderDoc.data() 
          } ]);
          setLoading(false);
          return;
        }

        // 2. Fallback: Coba ekstrak Firebase ID dari midtransOrderId
        const firebaseId = midtransOrderId.split('-')[1];
        if (!firebaseId) {
          throw new Error('Invalid order ID format');
        }

        console.log('Trying fallback with Firebase ID:', firebaseId);
        const orderRef = doc(db, 'orders', firebaseId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          console.log('Found order by Firebase ID fallback');
          setOrder([{ id: orderSnap.id, ...orderSnap.data() } as Order]);
        } else {
          setError('Order not found in database');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [midtransOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-600">Order Not Found</h2>
            <p className="mt-4 text-gray-600">{error}</p>
            <p className="mt-2 text-sm text-gray-500">
              Order ID: {midtransOrderId}
            </p>
            <Button 
              onClick={() => router.push('/orders')}
              className="mt-6"
            >
              View My Orders
            </Button>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
          {order.length > 0 && order[0].paymentStatus === 'paid' 
  ? 'Payment Successful!' 
  : 'Payment Processing'}
          </h2>
          
          <div className="mt-6 space-y-4 text-left">
            <div className="flex justify-between">
              <span className="font-medium">Order ID:</span>
              <span>{order.length > 0 ? order[0].id : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`font-semibold ${
                order.length > 0 && order[0].paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {order.length > 0 ? order[0].paymentStatus?.toUpperCase() : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span>Rp {order.length > 0 ? order[0].total?.toLocaleString('id-ID') : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Method:</span>
              <span>
  {order.length > 0 ? (order[0].paymentMethod === 'payment_gateway' 
    ? 'Payment Gateway' 
    : 'Cash') : ''}
</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <Link href="/cashier" passHref>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}