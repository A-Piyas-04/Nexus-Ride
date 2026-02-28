import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function PaymentStatusScreen({ payment, variant, message }) {
  const navigate = useNavigate();

  const referenceType = payment?.reference_type ?? payment?.payment_type;
  const isSuccess = variant === 'success';

  const handleContinue = () => {
    if (referenceType === 'TOKEN') {
      navigate('/token-history', { replace: true });
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  if (isSuccess) {
    const isSubscription = referenceType === 'SUBSCRIPTION';
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full mb-4 w-fit">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            {isSubscription 
              ? 'Your subscription request has been sent for approval. You will be notified once the Transport Officer activates it.'
              : 'Your payment has been processed successfully and your token is ready.'}
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
            <p className="font-mono font-medium">{payment?.id || 'N/A'}</p>
          </div>

          <Button onClick={handleContinue} className="w-full">
            {isSubscription ? 'Go to Dashboard' : 'View My Tokens'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Failed</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <div className="text-sm text-gray-700">
            {message || 'We could not confirm your payment. Please try again.'}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => navigate('/dashboard', { replace: true })}>
            Back to Dashboard
          </Button>
          <Button onClick={handleContinue}>{referenceType === 'TOKEN' ? 'View My Tokens' : 'View Subscription'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

