import React from 'react';
import { Button } from './Button';

export function ActionCard({ icon: Icon, label, iconClassName, onClick, disabled, title }) {
  const button = (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-full rounded-lg border border-primary-500 bg-white text-gray-900 shadow-sm hover:shadow-md hover:border-primary-400 transition-all overflow-hidden ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="w-full min-h-[96px] px-3 py-3 flex flex-col items-center justify-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 ${disabled ? 'bg-gray-100' : ''}`}>
          {React.createElement(Icon, { className: `h-4 w-4 ${iconClassName}` })}
        </div>
        <p className="text-sm md:text-base font-semibold text-gray-900 text-center leading-tight break-words">
          {label}
        </p>
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
