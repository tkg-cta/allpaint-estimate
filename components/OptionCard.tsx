import React from 'react';
import { OptionItem, VehicleSize, PricingType } from '../types';
import { Check, Plus, Minus, ShoppingCart } from 'lucide-react';

interface OptionCardProps {
 option: OptionItem;
 vehicleSize: VehicleSize;
 value: number | boolean;
 onChange: (newValue: number | boolean) => void;
 onShowDetails: (option: OptionItem) => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({ option, vehicleSize, value, onChange, onShowDetails }) => {
 const getDisplayPrice = () => {
  if (typeof option.price === 'number') {
   return option.price;
  }
  return option.price[vehicleSize];
 };

 const unitPrice = getDisplayPrice();
 const isSelected = !!value;
 const quantity = typeof value === 'number' ? value : (value ? 1 : 0);

 const handleToggle = () => {
  if (option.pricingType === PricingType.PER_UNIT) return;
  onChange(isSelected ? 0 : 1);
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

 const handleShowDetails = (e: React.MouseEvent) => {
  e.stopPropagation();
  onShowDetails(option);
 };

 const displayPrice = isSelected && option.pricingType === PricingType.PER_UNIT
  ? unitPrice * quantity
  : unitPrice;

 return (
  <div
   className={`
        relative flex items-stretch bg-white border-b border-gray-100 last:border-0 py-4 px-2
        transition-colors duration-200
        ${isSelected ? 'bg-primary-50/30' : ''}
      `}
   onClick={option.pricingType !== PricingType.PER_UNIT ? handleToggle : undefined}
  >
   {/* Left Content */}
   <div className="flex-1 pr-4 flex flex-col justify-between min-w-0">
    <div>
     <h3 className={`font-bold text-base leading-tight mb-1 ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
      {option.name}
     </h3>
     <div className="text-lg font-bold text-gray-900 mb-1">
      {displayPrice.toLocaleString()}円
     </div>
     <p className="text-xs text-gray-400 line-clamp-1 mb-3">
      {option.description}
     </p>
    </div>

    <div>
     <button
      onClick={handleShowDetails}
      className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold hover:bg-blue-200 transition-colors"
     >
      詳細
     </button>
    </div>
   </div>

   {/* Right Image & Action */}
   <div className="relative w-28 h-24 flex-shrink-0">
    <img
     src={option.image}
     alt={option.name}
     className="w-full h-full object-cover rounded-lg shadow-sm"
    />

    {/* Action Button Overlay */}
    <div className="absolute -bottom-2 -right-2">
     {option.pricingType === PricingType.PER_UNIT ? (
      // Counter for PER_UNIT
      isSelected ? (
       <div className="flex flex-col items-center bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
        <button
         onClick={handleIncrement}
         className="w-8 h-8 flex items-center justify-center bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800"
        >
         <Plus size={14} />
        </button>
        <div className="w-8 h-6 flex items-center justify-center font-bold text-sm bg-white text-primary-900 border-y border-gray-100">
         {quantity}
        </div>
        <button
         onClick={handleDecrement}
         className="w-8 h-8 flex items-center justify-center bg-white text-gray-500 hover:bg-gray-50 active:bg-gray-100"
        >
         <Minus size={14} />
        </button>
       </div>
      ) : (
       <button
        onClick={handleIncrement}
        className="w-10 h-10 rounded-full bg-white text-primary-600 shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-transform active:scale-95"
       >
        <Plus size={20} />
       </button>
      )
     ) : (
      // Toggle for Normal Options
      <button
       onClick={(e) => {
        e.stopPropagation();
        handleToggle();
       }}
       className={`
                w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                ${isSelected
         ? 'bg-primary-600 text-white scale-110'
         : 'bg-white text-gray-400 hover:text-primary-600'
        }
              `}
      >
       {isSelected ? <Check size={20} strokeWidth={3} /> : <ShoppingCart size={18} />}
      </button>
     )}
    </div>
   </div>
  </div>
 );
};
