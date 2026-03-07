import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import { initiatePayment, initiateTokenPayment } from '../../services/payments';

export default function PaymentStartPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const referenceType = location.state?.referenceType;
  const referenceId = location.state?.referenceId ?? null;
  const tokenPayload = location.state?.tokenPayload ?? null;
  const monthsSelected = location.state?.monthsSelected ?? null;
  const subscriptionAmount = location.state?.subscriptionAmount ?? null;

  const [paymentMethod, setPaymentMethod] = React.useState('BKASH');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const canStart =
    referenceType === 'SUBSCRIPTION' ? Boolean(referenceId) : referenceType === 'TOKEN' ? Boolean(tokenPayload) : false;

  const handleStart = async () => {
    if (!canStart) return;

    setSubmitting(true);
    setError(null);

    try {
      let payment;

      if (referenceType === 'TOKEN') {
        payment = await initiateTokenPayment({ ...tokenPayload, payment_method: paymentMethod });
      } else {
        payment = await initiatePayment({
          reference_type: referenceType,
          reference_id: referenceId,
          payment_method: paymentMethod,
        });
      }

      const paymentId = payment?.id;
      if (!paymentId) throw new Error('Payment initiation failed');

      navigate(`/payment/${paymentId}`, {
        replace: true,
        state: {
          payment,
          monthsSelected,
          subscriptionAmount,
        },
      });
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Unable to initiate payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="grid gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Payment</h1>
            <p className="text-sm text-gray-600">Review and initiate your payment.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium text-gray-900">{referenceType || '-'}</span>
                </div>
                {referenceType === 'SUBSCRIPTION' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subscription ID</span>
                    <span className="font-medium text-gray-900">{referenceId || '-'}</span>
                  </div>
                )}
                {referenceType === 'TOKEN' && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-700">
                    <div className="font-medium text-gray-900">Token Request</div>
                    <div className="mt-2 grid gap-1">
                      <div>Route: {tokenPayload?.route_id || '-'}</div>
                      <div>Stop: {tokenPayload?.pickup_stop_id || '-'}</div>
                      <div>Date: {tokenPayload?.travel_date || '-'}</div>
                      <div>Direction: {tokenPayload?.direction || '-'}</div>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-3 text-xs text-primary-800">
                  Amount is calculated by the backend after initiation.
                </div>
              </CardContent>
            </Card>

            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} disabled={submitting} />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => navigate('/dashboard')} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleStart} isLoading={submitting} disabled={!canStart}>
              Initiate Payment
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

