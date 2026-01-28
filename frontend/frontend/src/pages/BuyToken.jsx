import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import DashboardLayout from './dashboard/DashboardLayout';
import { useCurrentUser } from '../hooks/useCurrentUser';
import iutLogo from '../assets/iut-logo.png';

// Mock data for frontend-only implementation
const MOCK_ROUTES = [
  { id: 'route-1', name: 'Route 1: Mirpur' },
  { id: 'route-2', name: 'Route 2: Uttara' },
  { id: 'route-3', name: 'Route 3: Dhanmondi' },
];

const MOCK_STOPS = [
  { id: 'stop-1', name: 'Mirpur 10' },
  { id: 'stop-2', name: 'Mirpur 12' },
  { id: 'stop-3', name: 'ECB Chattar' },
  { id: 'stop-4', name: 'Uttara House Building' },
  { id: 'stop-5', name: 'Abdullahpur' },
];

export default function BuyToken() {
  const { userEmail } = useCurrentUser();
  
  const [direction, setDirection] = useState('to_iut'); // 'to_iut' or 'from_iut'
  const [consumerEmail, setConsumerEmail] = useState('');
  const [formData, setFormData] = useState({
    route_id: '',
    pickup_stop_id: '',
  });

  // Get today's date formatted
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDirectionChange = (e) => {
    setDirection(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = userEmail || consumerEmail;
    // Logic to buy token will go here later
    // For now, just show what would be sent
    console.log('Token Purchase Request:', { ...formData, direction, consumer_email: email });
    window.alert(`Token purchase simulated!\n\nDetails:\nDirection: ${direction === 'to_iut' ? 'To IUT' : 'From IUT'}\nRoute ID: ${formData.route_id}\nStop ID: ${formData.pickup_stop_id}\nEmail: ${email}`);
    // navigate('/token-history'); // Optional: redirect after "purchase"
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10 flex justify-center items-start min-h-[80vh]">
        <div className="w-full max-w-md">
            {/* Token Frame */}
            <div className="rounded-lg overflow-hidden shadow-2xl transform transition-transform hover:scale-[1.01]">
              
              {/* Ticket Upper Section (The "Image" Look) */}
              <div className="bg-[#F3E5AB] p-6 relative border-b-2 border-dashed border-gray-400">
                {/* Top Row: Logo - Title - Date */}
                <div className="flex flex-col items-center gap-4 relative">
                    
                    {/* Date (Top Right) */}
                    <div className="absolute -top-4 right-0">
                        <span className="text-black font-bold text-lg">{today}</span>
                    </div>
                    {/* Header Pill */}
                    <div className="bg-[#222] text-white px-6 py-2 rounded-full shadow-md z-10 mt-4">
                        <h1 className="text-xl font-bold tracking-wide">IUT Transport Service</h1>
                    </div>

                    {/* Logo (Absolute Top Left) */}
                    <div className="absolute top-0 left-0">
                         <img src={iutLogo} alt="IUT Logo" className="w-12 h-auto" />
                    </div>
                </div>

                {/* Middle Content */}
                <div className="mt-8 text-center space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        Commuting To and From IUT
                    </h2>
                    <div className="py-2">
                        <p className="text-4xl font-black text-gray-900">TK. 200.00</p>
                        <p className="text-lg italic text-gray-700 font-medium">For One way</p>
                    </div>
                </div>
              </div>

              {/* Input Fields Section (White Background) */}
              <div className="p-6 bg-white">
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Direction Selection */}
                  <div className="space-y-2 text-left">
                    <Label className="text-gray-700 font-medium block mb-2">Direction</Label>
                    <div className="flex space-x-4">
                      <label className={`flex items-center justify-center space-x-2 cursor-pointer border p-3 rounded-md w-full transition-all ${direction === 'to_iut' ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'hover:bg-gray-50 border-gray-300'}`}>
                        <input
                          type="radio"
                          name="direction"
                          value="to_iut"
                          checked={direction === 'to_iut'}
                          onChange={handleDirectionChange}
                          className="sr-only" // Hide default radio
                        />
                         <span className={`text-sm font-bold ${direction === 'to_iut' ? 'text-primary-700' : 'text-gray-700'}`}>To IUT</span>
                      </label>
                      <label className={`flex items-center justify-center space-x-2 cursor-pointer border p-3 rounded-md w-full transition-all ${direction === 'from_iut' ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'hover:bg-gray-50 border-gray-300'}`}>
                        <input
                          type="radio"
                          name="direction"
                          value="from_iut"
                          checked={direction === 'from_iut'}
                          onChange={handleDirectionChange}
                          className="sr-only"
                        />
                        <span className={`text-sm font-bold ${direction === 'from_iut' ? 'text-primary-700' : 'text-gray-700'}`}>From IUT</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="route_id" className="text-gray-700 font-medium">Select Route</Label>
                    <select
                      id="route_id"
                      name="route_id"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      value={formData.route_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Choose Route --</option>
                      {MOCK_ROUTES.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="pickup_stop_id" className="text-gray-700 font-medium">
                      {direction === 'to_iut' ? 'Pickup Stoppage' : 'Drop-off Stoppage'}
                    </Label>
                    <select
                      id="pickup_stop_id"
                      name="pickup_stop_id"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      value={formData.pickup_stop_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Choose Stoppage --</option>
                      {MOCK_STOPS.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <Label htmlFor="consumer_email" className="text-gray-700 font-medium">Consumer Email</Label>
                    <Input
                      id="consumer_email"
                      name="consumer_email"
                      type="email"
                      placeholder="Enter email"
                      value={userEmail || consumerEmail}
                      onChange={(e) => setConsumerEmail(e.target.value)}
                      disabled={Boolean(userEmail)}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="w-full h-12 text-lg font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all">
                      Buy Token
                    </Button>
                  </div>
                </form>
              </div>
            </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
