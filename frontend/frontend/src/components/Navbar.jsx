import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';
import { useAuth } from '../context/auth-context';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notifications';

export function Navbar({ links = [] }) {
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications(5); // Fetch latest 5 for dropdown
      setNotifications(data);
      const count = data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      // Create a local async function to call fetchNotifications
      const load = async () => {
         if (isMounted) await fetchNotifications();
      };
      
      load();
      // Poll every 30 seconds
      const interval = setInterval(() => {
        if (isMounted) fetchNotifications();
      }, 30000);
      
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) handleMarkRead(n.id, { stopPropagation: () => {} });
    // Navigate based on reference type if needed
    setIsNotificationsOpen(false);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const link of links) {
        const element = document.getElementById(link.targetId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(link.targetId);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [links]);

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleProfileClick = () => {
    if (user?.user_type === 'DRIVER') {
      navigate('/driver-profile');
    } else {
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-green-900 border-b border-green-800 mb-6 shadow-md">
      <div className="w-full px-4 md:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-40 flex-1">
            <button
              onClick={handleLogoClick}
              className="group flex items-center gap-2 focus:outline-none"
              aria-label="NexusRide dashboard"
            >
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-green-100 transition-colors">
                NexusRide
              </span>
              <span className="h-6 w-[2px] bg-green-800 group-hover:h-8 group-hover:bg-green-400 transition-all duration-200 ease-out" />
            </button>

            <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
              {links.map((link) => (
                <button
                  key={link.targetId}
                  onClick={(e) => scrollToSection(e, link.targetId)}
                  className={cn(
                    'whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-green-900',
                    activeSection === link.targetId
                      ? 'bg-green-800 text-white font-semibold shadow-sm'
                      : 'text-green-100 hover:bg-green-800/50 hover:text-white'
                  )}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-green-100 hover:text-white hover:bg-green-800 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 relative"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-green-900" />
                )}
              </button>

              {/* Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                            {!n.is_read && (
                              <button
                                onClick={(e) => handleMarkRead(n.id, e)}
                                className="text-blue-400 hover:text-blue-600 p-1"
                                title="Mark as read"
                              >
                                <span className="h-2 w-2 bg-blue-500 rounded-full block" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100 text-center">
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setIsNotificationsOpen(false);
                      }}
                      className="text-sm text-green-700 font-medium hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleProfileClick}
              className="bg-green-700/100 text-white hover:bg-green-700"
            >
              Profile
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="outline"
              onClick={handleProfileClick}
              className="bg-green-800/90 text-white px-3 py-1 text-xs"
            >
              Profile
            </Button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-green-100 hover:text-white hover:bg-green-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {links.map((link) => (
              <button
                key={link.targetId}
                onClick={(e) => scrollToSection(e, link.targetId)}
                className={cn(
                  'block w-full text-left px-4 py-3 text-base font-medium rounded-md transition-colors',
                  activeSection === link.targetId
                    ? 'bg-green-800 text-white'
                    : 'text-green-100 hover:bg-green-800/50 hover:text-white'
                )}
              >
                {link.name}
              </button>
            ))}

            <div className="mt-3 space-y-2 px-2">
              <Button
                variant="outline"
                onClick={handleProfileClick}
                className="w-full bg-green-800/90 text-white hover:bg-green-700"
              >
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
