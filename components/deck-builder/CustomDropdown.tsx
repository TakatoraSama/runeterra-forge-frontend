'use client';

import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative inline-block min-w-32.5">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-1.5 bg-bg-panel font-body text-[13px] cursor-pointer whitespace-nowrap transition-colors border rounded-(--radius-btn) ${isOpen ? 'border-gold-mid' : 'border-border-dark'} ${value ? 'text-text-primary' : 'text-text-disabled'}`}
      >
        <span>{selectedLabel}</span>
        {/* Chevron */}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M1 1L5 5L9 1" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Options list */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+4px)] left-0 min-w-full bg-bg-surface border border-border-dark rounded-(--radius-btn) shadow-(--shadow-panel) z-50 overflow-hidden"
        >
          {options.map(option => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3.5 py-1.75 text-[13px] font-body cursor-pointer transition-colors select-none hover:bg-bg-panel ${option.value === value ? 'text-gold-mid' : 'text-text-primary'}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
