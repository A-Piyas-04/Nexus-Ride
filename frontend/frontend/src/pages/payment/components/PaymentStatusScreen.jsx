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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSuccess ? 'Payment Successful' : 'Payment Failed'}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div className="text-sm text-gray-700">
            {message ||
              (isSuccess
                ? 'Your payment has been confirmed. The backend will provision your service automatically.'
                : 'We could not confirm your payment. Please try again.')}
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

