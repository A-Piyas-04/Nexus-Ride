import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { getRevenueOverTime } from '../../services/analytics';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { exportChartPdf } from '../../utils/exportChartPdf';

export default function RevenueOverTime() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rangeUnit, setRangeUnit] = useState('weeks');
  const [rangeValue, setRangeValue] = useState(2);
  const chartContainerRef = useRef(null);
  const tokenUnitPrice = 50;

  const days = useMemo(() => {
    const v = Number(rangeValue) || 1;
    const d = rangeUnit === 'months' ? v * 30 : v * 7;
    return Math.min(90, Math.max(1, d));
  }, [rangeUnit, rangeValue]);

  const tokenAveragesByWeekday = useMemo(() => {
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const stats = weekdayNames.map((name) => ({
      weekday: name,
      days: 0,
      tokenCountTotal: 0,
      tokenAmountTotal: 0,
    }));

    for (const point of data) {
      const dt = new Date(point?.date);
      if (Number.isNaN(dt.getTime())) continue;
      const weekdayIndex = dt.getDay();
      const tokenCount = Number(point?.token_count) || 0;
      const tokenAmount = Number(point?.token_amount) || tokenCount * tokenUnitPrice;

      stats[weekdayIndex].days += 1;
      stats[weekdayIndex].tokenCountTotal += tokenCount;
      stats[weekdayIndex].tokenAmountTotal += tokenAmount;
    }

    const order = [6, 0, 1, 2, 3, 4, 5];
    return order.map((idx) => {
      const row = stats[idx];
      const avgCount = row.days ? row.tokenCountTotal / row.days : 0;
      const avgAmount = row.days ? row.tokenAmountTotal / row.days : 0;
      return {
        weekday: row.weekday,
        days: row.days,
        avgTokenCount: avgCount,
        avgTokenAmount: avgAmount,
      };
    });
  }, [data, tokenUnitPrice]);

  const navLinks = [
    { name: 'Revenue', targetId: 'revenue-over-time' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getRevenueOverTime(days);
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-6xl space-y-6">
            <div id="revenue-over-time" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900">Revenue over time</h2>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-gray-700">Range</div>
                  <select value={rangeUnit} onChange={(e) => setRangeUnit(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                  <select
                    value={rangeValue}
                    onChange={(e) => setRangeValue(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {rangeUnit === 'weeks' ? (
                      <>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                      </>
                    ) : (
                      <>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </>
                    )}
                  </select>
                  <div className="text-xs text-gray-500">({days} days)</div>
                </div>
                <Button variant="secondary" onClick={() => exportChartPdf(chartContainerRef.current, 'revenue-over-time.pdf')} disabled={loading || data.length === 0}>Download PDF</Button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm mt-3">
                {loading ? (
                  <div className="px-4 py-6 text-center text-gray-500">Loading…</div>
                ) : error ? (
                  <div className="px-4 py-4">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                  </div>
                ) : data.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500">No data for this period.</div>
                ) : (
                  <div className="p-4">
                    <div ref={chartContainerRef} className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.map((d) => ({ ...d, dateLabel: String(d.date).slice(0, 10), total_amount: Number(d.total_amount) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value, name) => [name === 'total_amount' ? `BDT ${value}` : value, name === 'total_amount' ? 'Amount' : name]} labelFormatter={(label) => `Date: ${label}`} />
                          <Legend />
                          <Line type="monotone" dataKey="total_amount" name="Amount (BDT)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="token_count" name="Token payments" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="subscription_count" name="Subscription payments" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-800">Average token payments by weekday</div>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600">
                              <th className="py-2 pr-4 font-medium">Weekday</th>
                              <th className="py-2 pr-4 font-medium">Avg token count</th>
                              <th className="py-2 pr-4 font-medium">Avg token amount (BDT)</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-800">
                            {tokenAveragesByWeekday.map((row) => (
                              <tr key={row.weekday} className="border-t border-gray-100">
                                <td className="py-2 pr-4">{row.weekday}</td>
                                <td className="py-2 pr-4">{row.avgTokenCount.toFixed(2)}</td>
                                <td className="py-2 pr-4">
                                  {row.avgTokenAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Token amount is estimated as token count × {tokenUnitPrice} BDT.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
