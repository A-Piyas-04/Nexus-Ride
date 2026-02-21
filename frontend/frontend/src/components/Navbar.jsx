import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';
import { useAuth } from '../context/auth-context';

export function Navbar({ links = [] }) {
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    navigate('/profile');
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
