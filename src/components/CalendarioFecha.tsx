// CalendarioFecha.tsx

'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import React from 'react';

type CalendarioFechaProps = {
  date: Date | undefined;
  onDateChange: (date: Date) => void;
};

export default function CalendarioFecha({ date, onDateChange }: CalendarioFechaProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);

  // Update selectedDate if the prop 'date' changes externally
  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleSelect = (d: Date | undefined) => {
    setSelectedDate(d);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* The button that triggers the popover, styled to resemble the input field */}
        <button className="w-45 flex items-center gap-2 gap-2 border-white rounded px-4 py-2 text-sm bg-white shadow hover:bg-white ">
          <CalendarIcon className="w-4 h-4 text-[#802528]" />
          <span className={date ? 'text-[#76787A]' : 'text-[#76787A]'}>
          {date 
          ? format(date, 'dd / MM / yyyy', { locale: es }) 
          : 'Seleccionar fecha'}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="p-0 z-50 border-none shadow-lg rounded-md max-w-[280px] max-h-[320px]"
        style={{ width: 'fit-content', maxHeight: 'auto', overflow: 'visible' }}
      >


        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={es}
          disabled={() => false}
        />

        {/* Footer section for date display and selection button */}
        <div className="flex flex-row items-center justify-between gap-4 p-3 border-t border-gray-200">
          <div className="border border-gray-300 rounded px-4 py-2 text-sm text-[#111827] w-[125px]">
            {selectedDate
              ? format(selectedDate, 'dd / MM / yyyy', { locale: es })
              : 'dd / mm / yyyy'}
          </div>
          <button
            onClick={handleConfirm}
            className="bg-[#802528] text-white rounded px-4 py-2 text-sm w-fit whitespace-nowrap hover:bg-[#6a1f22]"
          >
            Seleccionar
          </button>
        </div>

      </PopoverContent>
    </Popover>
  );
}
