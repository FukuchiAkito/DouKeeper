import React from 'react';

type InputProps = {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  name,
  required = false,
  disabled = false,
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      name={name}
      required={required}
      disabled={disabled}
      className="
      px-4 py-2 rounded-md border border-gray-300
      text-sm text-gray-700 bg-white shadow-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500
      "
    />
  );
};

export default Input;
