import React from 'react';
import { OptionItem, VehicleSize, PricingType } from '../types';
import { CheckCircle2, Plus, Minus } from 'lucide-react';

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

 const unitPrice = getDisplayPrice();
 // Simplified logic: If value is truthy (true or > 0), it is selected
 const isSelected = !!value;
 const quantity = typeof value === 'number' ? value : (value ? 1 : 0);

 const handleToggle = () => {
  // Only toggle for non-unit options
  if (option.pricingType === PricingType.PER_UNIT) return;

  if (isSelected) {
   onChange(0);
  } else {
   onChange(1);
  }
 };

 const handleIncrement = (e: React.MouseEvent) => {
  e.stopPropagation();
  onChange(quantity + 1);
 };

 const handleDecrement = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (quantity > 0) {
   onChange(quantity - 1);
  }
 };

 // Calculate display price: Total if selected, Unit price if not
 const displayPrice = isSelected && option.pricingType === PricingType.PER_UNIT
  ? unitPrice * quantity
  : unitPrice;

 return (
  <div
   className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200 
        flex flex-row bg-white hover:shadow-md group
        ${isSelected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200'}
        ${option.pricingType !== PricingType.PER_UNIT ? 'cursor-pointer' : ''}
      `}
   onClick={handleToggle}
  >
   {/* Thumbnail: Fixed Square on the Left */}
   <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 relative border-r border-gray-100">
    <img src={option.image} alt={option.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
    {isSelected && option.pricingType !== PricingType.PER_UNIT && (
     <div className="absolute top-2 left-2 bg-primary-600 text-white rounded-full p-1 shadow-sm z-10">
      <CheckCircle2 size={16} />
     </div>
    )}
    {isSelected && option.pricingType === PricingType.PER_UNIT && quantity > 0 && (
     <div className="absolute top-2 left-2 bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 text-xs font-bold">
      {quantity}
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

    <div className="flex items-end justify-between mt-1">
     {/* Quantity Controls for PER_UNIT */}
     {option.pricingType === PricingType.PER_UNIT ? (
      <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-1 shadow-sm" onClick={e => e.stopPropagation()}>
       <button
        onClick={handleDecrement}
        disabled={quantity === 0}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
       >
        <Minus size={14} />
       </button>
       <span className="font-bold text-gray-800 w-4 text-center text-sm">{quantity}</span>
       <button
        onClick={handleIncrement}
        className="w-7 h-7 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors"
       >
        <Plus size={14} />
       </button>
      </div>
     ) : (
      <div></div> // Spacer
     )}

     <div className="text-right">
      <span className={`text-lg font-bold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
       ¥{displayPrice.toLocaleString()}
      </span>
      {option.unitLabel && !isSelected && (
       <span className="text-xs text-gray-500 ml-1">
        / {option.unitLabel}
       </span>
      )}
     </div>
    </div>
   </div>
  </div>
 );
};
