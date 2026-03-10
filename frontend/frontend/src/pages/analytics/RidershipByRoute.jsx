import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { getRidershipByRoute } from '../../services/analytics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { exportChartPdf } from '../../utils/exportChartPdf';

export default function RidershipByRoute() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rangeUnit, setRangeUnit] = useState('weeks');
  const [rangeValue, setRangeValue] = useState(4);
  const chartContainerRef = useRef(null);

  const days = useMemo(() => {
    const v = Number(rangeValue) || 1;
    const d = rangeUnit === 'months' ? v * 30 : v * 7;
    return Math.min(90, Math.max(1, d));
  }, [rangeUnit, rangeValue]);

  const navLinks = [
    { name: 'Ridership by route', targetId: 'ridership-by-route' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getRidershipByRoute(days);
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
            <div id="ridership-by-route" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900">Ridership by route</h2>
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
                <Button variant="secondary" onClick={() => exportChartPdf(chartContainerRef.current, 'ridership-by-route.pdf')} disabled={loading || data.length === 0}>Download PDF</Button>
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
                        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 80, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="route_name" width={75} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="passengers_total" name="Passengers" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
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
