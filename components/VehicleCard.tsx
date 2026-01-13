import React from 'react';
import { VehicleType } from '../types';
import { Check, Circle } from 'lucide-react';

interface VehicleCardProps {
 vehicle: VehicleType;
 isSelected: boolean;
 onClick: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, isSelected, onClick }) => {
 return (
  <div
   className={`
        relative flex items-stretch bg-white border-b border-gray-100 last:border-0 py-4 px-2
        transition-colors duration-200 cursor-pointer
        ${isSelected ? 'bg-primary-50/30' : 'hover:bg-gray-50'}
      `}
   onClick={onClick}
  >
   {/* Left Content */}
   <div className="flex-1 pr-4 flex flex-col justify-between min-w-0">
    <div>
     <h3 className={`font-bold text-base leading-tight mb-1 ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
      {vehicle.name}
     </h3>
     <div className="text-lg font-bold text-gray-900 mb-1">
      ¥{vehicle.prices.solid.toLocaleString()}
      <span className="text-xs text-gray-500 font-normal ml-1">〜</span>
     </div>
     <p className="text-xs text-gray-400 line-clamp-1 mb-3">
      塗装基本料金
     </p>
    </div>
   </div>

   {/* Right Image & Action */}
   <div className="relative w-28 h-24 flex-shrink-0">
    <img
     src={vehicle.image}
     alt={vehicle.name}
     className="w-full h-full object-cover rounded-lg shadow-sm"
    />

    {/* Action Button Overlay */}
    <div className="absolute -bottom-2 -right-2">
     <button
      className={`
               w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
               ${isSelected
        ? 'bg-primary-600 text-white scale-110'
        : 'bg-white text-gray-400 hover:text-primary-600'
       }
             `}
     >
      {isSelected ? <Check size={20} strokeWidth={3} /> : <Circle size={20} />}
     </button>
    </div>
   </div>
  </div>
 );
};
