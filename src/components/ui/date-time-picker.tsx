import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date | null) => void;
  className?: string;
  showTimeSelect?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholderText?: string;
  disabled?: boolean;
}

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ 
    value,
    onChange,
    className,
    showTimeSelect = true,
    minDate,
    maxDate,
    placeholderText = 'Select date and time',
    disabled = false,
    ...props
  }, ref) => {
    return (
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MMMM d, yyyy h:mm aa"
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        disabled={disabled}
        {...props}
      />
    );
  }
); 