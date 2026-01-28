import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';

export function ActionCard({ icon: Icon, label, description, iconClassName, onClick, disabled, title }) {
  const button = (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[130px] md:min-h-[160px] rounded-xl border-2 border-primary-300 bg-white text-gray-900 shadow-md hover:shadow-lg hover:border-primary-400 transition-all px-6 py-6 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="w-full flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 ${disabled ? 'bg-gray-100' : ''}`}>
          {React.createElement(Icon, { className: `h-6 w-6 ${iconClassName}` })}
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-lg md:text-xl">{label}</p>
          <p className="text-sm md:text-base text-gray-500">{description}</p>
        </div>
        {!disabled && <ArrowRight className="h-5 w-5 text-gray-400" />}
      </div>
    </Button>
  );

  if (disabled && title) {
    return (
      <div className="w-full h-full cursor-not-allowed" title={title}>
        {button}
      </div>
    );
  }

  return button;
}
