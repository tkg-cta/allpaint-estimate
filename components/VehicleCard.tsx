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
  <>
   {/* Mobile: Horizontal Layout (like OptionCard) */}
   <div
    className={`
          md:hidden
          relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer
          flex flex-row bg-white hover:shadow-md group
          ${isSelected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200'}
        `}
    onClick={onClick}
   >
    {/* Thumbnail: Fixed Square on the Left */}
    <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 relative border-r border-gray-100">
     <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
     {isSelected && (
      <div className="absolute top-2 left-2 bg-primary-600 text-white rounded-full p-1 shadow-sm z-10">
       <Check size={16} />
      </div>
     )}
    </div>

    {/* Content: Text on the Right */}
    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
     <div>
      <h3 className={`font-bold text-sm sm:text-base leading-tight mb-1 ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>
       {vehicle.name}
      </h3>
     </div>

     <div className="text-right mt-1">
      <span className={`text-lg font-bold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
       ¥{vehicle.basePrice.toLocaleString()}
      </span>
     </div>
    </div>
   </div>

   {/* Desktop: Vertical Layout (original design) */}
   <div
    className={`
          hidden md:flex flex-col
          relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer group
          ${isSelected
      ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100 scale-105'
      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
     }
        `}
    onClick={onClick}
   >
    <div className="aspect-video relative overflow-hidden bg-gray-100">
     <img
      src={vehicle.image}
      alt={vehicle.name}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
     />
     {isSelected && (
      <div className="absolute top-3 right-3 bg-primary-600 text-white rounded-full p-2 shadow-lg">
       <Check size={20} />
      </div>
     )}
    </div>

    <div className="p-4">
     <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>
      {vehicle.name}
     </h3>
     <div className="flex items-baseline justify-between">
      <span className="text-sm text-gray-500">基本料金</span>
      <span className={`text-xl font-bold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
       ¥{vehicle.basePrice.toLocaleString()}
      </span>
     </div>
    </div>
   </div>
  </>
 );
};
