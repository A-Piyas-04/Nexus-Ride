import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../utils/cn';

export function Navbar({ links }) {
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky navbar + any other fixed headers
      const offset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false); // Close mobile menu after click
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset

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

  return (
    <nav className="sticky top-0 z-30 w-full bg-green-900 border-b border-green-800 mb-6 transition-all shadow-md">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Mobile Menu Button (Top Right) */}
          <div className="flex md:hidden w-full justify-end">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-green-100 hover:text-white hover:bg-green-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
            {links.map((link) => (
              <button
                key={link.targetId}
                onClick={(e) => scrollToSection(e, link.targetId)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-green-900",
                  activeSection === link.targetId
                    ? "bg-green-800 text-white font-semibold shadow-sm"
                    : "text-green-100 hover:bg-green-800/50 hover:text-white"
                )}
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {links.map((link) => (
              <button
                key={link.targetId}
                onClick={(e) => scrollToSection(e, link.targetId)}
                className={cn(
                  "block w-full text-left px-4 py-3 text-base font-medium rounded-md transition-colors",
                  activeSection === link.targetId
                    ? "bg-green-800 text-white"
                    : "text-green-100 hover:bg-green-800/50 hover:text-white"
                )}
              >
                {link.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
