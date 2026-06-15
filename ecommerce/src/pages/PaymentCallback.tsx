import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('order_status');
    const cfOrderId = searchParams.get('cf_order_id');

    console.log('Payment callback received:', { orderId, status, cfOrderId });

    // You can verify the payment status with your backend here
    
    // Redirect to orders page after a short delay
    setTimeout(() => {
      navigate('/your-orders');
    }, 3000);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Processing Payment...</h2>
        <p className="text-slate-400">Please wait while we confirm your payment</p>
      </div>
    </div>
  );
}