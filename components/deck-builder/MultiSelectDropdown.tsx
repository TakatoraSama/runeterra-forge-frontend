'use client';

import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectDropdown({
  options,
  values,
  onChange,
  placeholder = 'Select...',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (options.find(o => o.value === values[0])?.label ?? placeholder)
        : `${values.length} selected`;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleValue(val: string) {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val));
    } else {
      onChange([...values, val]);
    }
  }

  return (
    <div ref={wrapperRef} className="relative inline-block min-w-32.5">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-1.5 bg-bg-panel font-body text-[13px] cursor-pointer whitespace-nowrap transition-colors border rounded-(--radius-btn) ${isOpen ? 'border-gold-mid' : 'border-border-dark'} ${values.length > 0 ? 'text-text-primary' : 'text-text-disabled'}`}
      >
        <span>{triggerLabel}</span>
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
          aria-multiselectable="true"
          className="absolute top-[calc(100%+4px)] left-0 min-w-full bg-bg-surface border border-border-dark rounded-(--radius-btn) shadow-(--shadow-panel) z-50 overflow-hidden"
        >
          {options.map(option => {
            const isSelected = values.includes(option.value);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => toggleValue(option.value)}
                className={`flex items-center gap-2 px-3 py-1.75 text-[13px] font-body cursor-pointer transition-colors select-none hover:bg-bg-panel ${isSelected ? 'text-gold-mid' : 'text-text-primary'}`}
              >
                {/* Checkmark */}
                <span className="w-3 shrink-0">
                  {isSelected && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4L4.5 7.5L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {/* Region icon */}
                {option.icon && (
                  <img src={option.icon} alt="" className="w-4 h-4 object-contain shrink-0 opacity-80" />
                )}
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
