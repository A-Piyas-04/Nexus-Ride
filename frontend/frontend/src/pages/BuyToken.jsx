import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './dashboard/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useCurrentUser } from '../hooks/useCurrentUser';
import iutLogo from '../assets/iut-logo.png';

export default function BuyToken() {
  const navigate = useNavigate();

  const { userEmail } = useCurrentUser();

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);

  const [direction, setDirection] = useState("UP");
  const [consumerEmail, setConsumerEmail] = useState("");

  const [formData, setFormData] = useState({
    route_id: "",
    pickup_stop_id: "",
    travel_date: new Date().toISOString().split("T")[0],
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // ================= LOAD ROUTES =================
  useEffect(() => {
    axios.get(`${apiUrl}/routes`)
      .then(res => setRoutes(res.data))
      .catch(() => alert("Failed to load routes"));
  }, [apiUrl]);

  // ================= LOAD STOPS =================
  useEffect(() => {
    if (!formData.route_id) return;

    axios.get(`${apiUrl}/stops/${formData.route_id}/stops`)
      .then(res => setStops(res.data))
      .catch(() => alert("Failed to load stops"));
  }, [formData.route_id, apiUrl]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required");
      return;
    }

    navigate('/payment', {
      state: {
        referenceType: 'TOKEN',
        tokenPayload: {
          route_id: formData.route_id,
          pickup_stop_id: formData.pickup_stop_id,
          consumer_email: userEmail || consumerEmail,
          travel_date: formData.travel_date,
          direction,
        },
      },
    });
  };

  return (
    <DashboardLayout>
      <section className="w-full flex justify-center pt-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">

          <img src={iutLogo} className="w-12 mb-4" />

          <Label>Direction</Label>
          <select value={direction} onChange={e => setDirection(e.target.value)} className="w-full mb-4">
            <option value="UP">To IUT</option>
            <option value="DOWN">From IUT</option>
          </select>

          <Label>Travel date</Label>
          <input
            type="date"
            name="travel_date"
            value={formData.travel_date}
            onChange={handleChange}
            min={todayStr}
            required
            className="w-full mb-4 border border-gray-300 rounded px-3 py-2"
          />

          <Label>Select Route</Label>
          <select name="route_id" value={formData.route_id} onChange={handleChange} required className="w-full mb-4">
            <option value="">Choose route</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.route_name}</option>
            ))}
          </select>

          <Label>Select Stop</Label>
          <select name="pickup_stop_id" value={formData.pickup_stop_id} onChange={handleChange} required className="w-full mb-4">
            <option value="">Choose stop</option>
            {stops.map(s => (
              <option key={s.id} value={s.id}>{s.stop_name}</option>
            ))}
          </select>

          <Label>Email</Label>
          <Input
            value={userEmail || consumerEmail}
            disabled={!!userEmail}
            onChange={e => setConsumerEmail(e.target.value)}
            required
          />

          <Button className="w-full mt-6">Continue to Payment</Button>

        </form>
      </section>
    </DashboardLayout>
  );
}
