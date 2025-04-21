import { NextResponse } from 'next/server';
import { collection,  query,  getDocs, doc, updateDoc, where, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'



export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // 1. Dapatkan order_id dari Midtrans
    const midtransOrderId = body.order_id;
    console.log('Full Midtrans Order ID:', midtransOrderId);

    // 2. Ekstrak Firebase document ID dari midtransOrderId
    // Format: ORDER-{firebaseId}-{timestamp}
    const firebaseId = midtransOrderId.split('-')[1];
    console.log('Extracted Firebase ID:', firebaseId);

    if (!firebaseId) {
      throw new Error('Invalid order ID format - cannot extract Firebase ID');
    }

    // 3. Cari order di Firebase berdasarkan midtransOrderId
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('midtransOrderId', '==', midtransOrderId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No order found with midtransOrderId:', midtransOrderId);
      
      // Fallback: Coba dengan Firebase ID saja
      const orderRef = doc(db, 'orders', firebaseId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        console.log('Found order using Firebase ID fallback');
        await updateDoc(orderRef, {
          paymentStatus: body.transaction_status === 'settlement' ? 'paid' : body.transaction_status,
          midtransResponse: body,
          updatedAt: new Date()
        });
        return NextResponse.json({ success: true });
      }
      
      throw new Error(`Order not found with ID: ${midtransOrderId} or ${firebaseId}`);
    }

    // 4. Update semua order yang cocok (seharusnya hanya 1)
    const updatePromises = querySnapshot.docs.map(async (doc) => {
      await updateDoc(doc.ref, {
        paymentStatus: body.transaction_status === 'settlement' ? 'paid' : body.transaction_status,
        midtransResponse: body,
        updatedAt: new Date()
      });
      console.log(`Updated order ${doc.id} successfully`);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}