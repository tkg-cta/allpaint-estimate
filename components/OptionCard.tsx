import React from 'react';
import { OptionItem, VehicleSize } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface OptionCardProps {
  option: OptionItem;
  vehicleSize: VehicleSize;
  value: number | boolean;
  onChange: (newValue: number | boolean) => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({ option, vehicleSize, value, onChange }) => {
  const getDisplayPrice = () => {
    if (typeof option.price === 'number') {
      return option.price;
    }
    return option.price[vehicleSize];
  };

  const price = getDisplayPrice();
  // Simplified logic: If value is truthy (true or > 0), it is selected
  const isSelected = !!value;

  const handleToggle = () => {
    // If currently selected (true or >0), toggle to false/0. 
    // If currently not selected, toggle to 1 (for compatibility) or true.
    if (isSelected) {
      onChange(0); // or false
    } else {
      onChange(1); // or true
    }
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer
        flex flex-row bg-white hover:shadow-md group
        ${isSelected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200'}
      `}
      onClick={handleToggle}
    >
      {/* Thumbnail: Fixed Square on the Left */}
      <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 relative border-r border-gray-100">
         <img src={option.image} alt={option.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
         {isSelected && (
          <div className="absolute top-2 left-2 bg-primary-600 text-white rounded-full p-1 shadow-sm z-10">
             <CheckCircle2 size={16} />
          </div>
         )}
      </div>

      {/* Content: Text on the Right */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className={`font-bold text-sm sm:text-base leading-tight mb-1 ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>
            {option.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {option.description}
          </p>
        </div>

        <div className="text-right mt-1">
          <span className={`text-lg font-bold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
            ¥{price.toLocaleString()}
          </span>
          {option.unitLabel && (
            <span className="text-xs text-gray-500 ml-1">
              / {option.unitLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
