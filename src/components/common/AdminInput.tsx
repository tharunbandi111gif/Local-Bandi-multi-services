import React, { forwardRef } from 'react';

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label?: string;
  as?: 'input' | 'textarea' | 'select';
  options?: { value: string | number; label: string }[];
  className?: string;
  error?: string;
}

export const AdminInput = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, AdminInputProps>(({
  label,
  as = 'input',
  options,
  className = '',
  error,
  ...props
}, ref) => {
  const baseInputStyle = "w-full bg-gray-50 text-gray-900 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none text-sm transition-all focus:bg-white shadow-sm disabled:opacity-50 select-text";

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {label && (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
          {label}
        </span>
      )}

      {as === 'select' ? (
        <div className="relative">
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            className={`${baseInputStyle} appearance-none pr-10`}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            ▼
          </div>
        </div>
      ) : as === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={`${baseInputStyle} resize-none min-h-[100px]`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          className={baseInputStyle}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error ? (
        <span className="text-rose-500 text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">
          {error}
        </span>
      ) : null}
    </div>
  );
});

AdminInput.displayName = 'AdminInput';
