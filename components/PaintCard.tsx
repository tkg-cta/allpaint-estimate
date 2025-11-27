import React from 'react';
import { PaintType } from '../types';
import { Check } from 'lucide-react';

interface PaintCardProps {
 paint: PaintType;
 isSelected: boolean;
 onClick: () => void;
}

export const PaintCard: React.FC<PaintCardProps> = ({ paint, isSelected, onClick }) => {
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
     src={paint.image}
     alt={paint.name}
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
      {paint.name}
     </h3>
     <p className="text-xs md:text-sm text-gray-500 md:text-gray-600 line-clamp-2 leading-relaxed mb-0 md:mb-3">
      {paint.description}
     </p>
    </div>

    <div className="text-right mt-1 md:mt-auto md:flex md:items-baseline md:justify-between">
     <span className="hidden md:inline text-sm text-gray-500">追加料金</span>
     <span className={`text-lg md:text-xl font-bold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
      +¥{paint.surcharge.toLocaleString()}
     </span>
    </div>
   </div>
  </div>
 );
};
