import axios from 'axios';

interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

const midtransConfig: MidtransConfig = {
  serverKey: process.env.NEXT_PUBLIC_MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
  isProduction: process.env.NEXT_PUBLIC_MIDTRANS_ENVIRONMENT === 'production',
};

const getBaseUrl = () => {
  return midtransConfig.isProduction
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';
};

export const loadSnapScript = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }

    if (window.snap) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `${getBaseUrl()}/snap/snap.js`;
    script.setAttribute('data-client-key', midtransConfig.clientKey);
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Snap script'));

    document.body.appendChild(script);
  });
};

interface TransactionParams {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
}

export const createSnapTransaction = async (params: TransactionParams) => {
  try {
    // Validasi parameter
    if (!params?.transaction_details?.order_id || !params?.transaction_details?.gross_amount) {
      throw new Error('Invalid transaction parameters');
    }

    // Gunakan API route sebagai proxy
    const response = await axios.post('/api/midtrans', params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.data?.token) {
      throw new Error('Invalid response from Midtrans');
    }

    return response.data;
  } catch (error: any) {
    console.error('Midtrans transaction error:', {
      message: error.message,
      response: error.response?.data,
      config: error.config,
    });
    throw new Error(`Payment failed: ${error.response?.data?.message || error.message}`);
  }
};