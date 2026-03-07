import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

export default function PaymentSummaryCard({ payment, displayAmount, amountNote }) {
  const amount = displayAmount ?? payment?.amount ?? '-';
  const currency = payment?.currency ?? 'BDT';
  const type = payment?.reference_type ?? payment?.payment_type ?? '-';
  const method = payment?.payment_method ?? '-';
  const status = payment?.status ?? '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
          <div className="text-sm text-gray-600">Amount</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-3xl font-semibold text-gray-900">{amount}</div>
            <div className="pb-1 text-sm text-gray-700">{currency}</div>
          </div>
          {amountNote ? (
            <div className="mt-1 text-xs text-gray-600">{amountNote}</div>
          ) : null}
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Type</span>
            <span className="font-medium text-gray-900">{type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Method</span>
            <span className="font-medium text-gray-900">{method}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-gray-900">{status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

