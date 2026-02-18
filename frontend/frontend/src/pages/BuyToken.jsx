import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './dashboard/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useCurrentUser } from '../hooks/useCurrentUser';
import iutLogo from '../assets/iut-logo.png';

export default function BuyToken() {

  const { userEmail } = useCurrentUser();

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);

  const [direction, setDirection] = useState("to_iut");
  const [consumerEmail, setConsumerEmail] = useState("");

  const [formData, setFormData] = useState({
    route_id: "",
    pickup_stop_id: ""
  });

  const today = new Date().toISOString().split("T")[0];

  // ================= LOAD ROUTES =================
  useEffect(() => {
    axios.get(`${apiUrl}/routes`)
      .then(res => setRoutes(res.data))
      .catch(() => alert("Failed to load routes"));
  }, []);

  // ================= LOAD STOPS =================
  useEffect(() => {
    if (!formData.route_id) return;

    axios.get(`${apiUrl}/routes/${formData.route_id}/stops`)
      .then(res => setStops(res.data))
      .catch(() => alert("Failed to load stops"));
  }, [formData.route_id]);

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

    try {
      await axios.post(`${apiUrl}/token/buy`, {
        route_id: formData.route_id,
        pickup_stop_id: formData.pickup_stop_id,
        consumer_email: userEmail || consumerEmail,
        travel_date: today,
        direction
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert("Token purchased successfully");

    } catch (err) {
      alert(err.response?.data?.detail || "Purchase failed");
    }
  };

  return (
    <DashboardLayout>
      <section className="w-full flex justify-center pt-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">

          <img src={iutLogo} className="w-12 mb-4" />

          <Label>Direction</Label>
          <select value={direction} onChange={e => setDirection(e.target.value)} className="w-full mb-4">
            <option value="TO_IUT">To IUT</option>
            <option value="FROM_IUT">From IUT</option>
          </select>

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

          <Button className="w-full mt-6">Buy Token</Button>

        </form>
      </section>
    </DashboardLayout>
  );
}
