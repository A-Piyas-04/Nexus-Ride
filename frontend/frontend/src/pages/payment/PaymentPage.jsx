import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import PaymentSummaryCard from './components/PaymentSummaryCard';
import PaymentStatusScreen from './components/PaymentStatusScreen';
import { confirmPayment, getMyPayments } from '../../services/payments';
import { getSubscription } from '../../services/auth';

const buildSimulatedTxnId = () => `SIMULATED-${Date.now()}`;

export default function PaymentPage() {
  const { payment_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [payment, setPayment] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  const [statusView, setStatusView] = React.useState(null);
  const [overrideAmount, setOverrideAmount] = React.useState(null);
  const [amountNote, setAmountNote] = React.useState(null);

  const fetchPayment = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payments = await getMyPayments();
      const found = payments.find((p) => String(p.id) === String(payment_id));
      if (!found) {
        setError('Payment not found or access denied.');
        setPayment(null);
        return;
      }
      setPayment(found);
      if (found.status === 'SUCCESS') setStatusView('success');
      if (found.status === 'FAILED' || found.status === 'CANCELLED') setStatusView('failed');
      // If subscription, compute client-side expected amount to display
      if ((found.reference_type ?? found.payment_type) === 'SUBSCRIPTION') {
        try {
          const sub = await getSubscription();
          const start = new Date(sub.start_date);
          const end = new Date(sub.end_date);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            const months =
              (end.getFullYear() - start.getFullYear()) * 12 +
              (end.getMonth() - start.getMonth()) +
              1;
            const m = Math.max(1, months);
            const total = m * 5000;
            setOverrideAmount(
              total.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            );
            setAmountNote(`Based on ${m} ${m === 1 ? 'month' : 'months'} at 5,000.00 BDT/month`);
          } else {
            setOverrideAmount(null);
            setAmountNote(null);
          }
        } catch {
          setOverrideAmount(null);
          setAmountNote(null);
        }
      } else {
        setOverrideAmount(null);
        setAmountNote(null);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || 'Unable to load payment details');
    } finally {
      setLoading(false);
    }
  }, [payment_id]);

  React.useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleConfirm = async (status) => {
    if (!payment || payment.status !== 'INITIATED') return;

    setConfirming(true);
    setError(null);
    try {
      const updated = await confirmPayment({
        payment_id,
        status,
        external_txn_id: buildSimulatedTxnId(),
      });
      setPayment(updated);
      if (updated.status === 'SUCCESS') setStatusView('success');
      if (updated.status === 'FAILED' || updated.status === 'CANCELLED') setStatusView('failed');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Payment confirmation failed');
    } finally {
      setConfirming(false);
    }
  };

  const referenceType = payment?.reference_type ?? payment?.payment_type;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="grid gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Confirm Payment</h1>
            <p className="text-sm text-gray-600">Review and confirm your payment.</p>
          </div>

          {loading && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-700">
              Loading payment details...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
              {error}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button onClick={fetchPayment}>Retry</Button>
              </div>
            </div>
          )}

          {!loading && !error && payment && statusView && (
            <PaymentStatusScreen
              payment={payment}
              variant={statusView === 'success' ? 'success' : 'failed'}
              message={
                statusView === 'success'
                  ? 'Payment confirmed. Your service will be provisioned automatically.'
                  : 'Payment was not successful. No service will be provisioned.'
              }
            />
          )}

          {!loading && !error && payment && !statusView && (
            <>
              <PaymentSummaryCard payment={payment} displayAmount={overrideAmount} amountNote={amountNote} />

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700">
                <div className="font-medium text-gray-900">Simulation</div>
                <div className="mt-1 text-gray-600">
                  No real gateway is integrated. Use the buttons below to simulate a payment outcome.
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => handleConfirm('FAILED')}
                  isLoading={confirming}
                  disabled={payment.status !== 'INITIATED'}
                >
                  Simulate Failure
                </Button>
                <Button
                  onClick={() => handleConfirm('SUCCESS')}
                  isLoading={confirming}
                  disabled={payment.status !== 'INITIATED'}
                >
                  Confirm Payment
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                After SUCCESS, NexusRide will {referenceType === 'TOKEN' ? 'create your token automatically' : 'send your subscription request for approval'}.
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

