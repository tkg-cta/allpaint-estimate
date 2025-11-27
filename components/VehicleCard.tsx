import React from 'react';
import { VehicleType } from '../types';
import { Check } from 'lucide-react';

interface VehicleCardProps {
 vehicle: VehicleType;
 isSelected: boolean;
 onClick: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, isSelected, onClick }) => {
 return (
  <div
   className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer group
        flex flex-row md:flex-col bg-white hover:shadow-md
        ${isSelected
     ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200 md:shadow-lg md:shadow-primary-100 md:scale-105'
     : 'border-gray-200 hover:border-primary-300'
    }
      `}
   onClick={onClick}
  >
   {/* Thumbnail */}
   <div className="
        w-28 h-28 sm:w-32 sm:h-32 md:w-full md:h-48 md:aspect-video 
        flex-shrink-0 bg-gray-100 relative border-r md:border-r-0 md:border-b border-gray-100
      ">
    <img
     src={vehicle.image}
     alt={vehicle.name}
     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 md:group-hover:scale-110"
    />
    {isSelected && (
     <div className="absolute top-2 left-2 md:top-3 md:right-3 md:left-auto bg-primary-600 text-white rounded-full p-1 md:p-2 shadow-sm z-10">
      <Check size={16} className="md:w-5 md:h-5" />
     </div>
    )}
   </div>

   {/* Content */}
   <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
    <div>
     <h3 className={`font-bold text-sm sm:text-base md:text-lg leading-tight mb-1 md:mb-2 ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>
      {vehicle.name}
     </h3>
     <div className="hidden md:block text-sm text-gray-500 mb-1">基本料金</div>
    </div>

    <div className="text-right md:flex md:items-baseline md:justify-between md:mt-auto">
     <span className="hidden md:inline text-sm text-gray-500"></span>
     <span className={`text-lg md:text-xl font-bold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
      ¥{vehicle.basePrice.toLocaleString()}
      <span className="md:hidden text-xs text-gray-500 font-normal ml-1">〜</span>
     </span>
    </div>
   </div>
  </div>
 );
};
