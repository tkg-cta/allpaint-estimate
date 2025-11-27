import React from 'react';
import { Check } from 'lucide-react';

interface StepWizardProps {
 currentStep: number;
 totalSteps: number;
 labels: string[];
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, totalSteps, labels }) => {
 return (
  <div className="w-full py-6">
   <div className="flex items-center justify-between relative z-10">
    {Array.from({ length: totalSteps }).map((_, index) => {
     const isCompleted = index < currentStep;
     const isCurrent = index === currentStep;

     return (
      <div key={index} className="flex flex-col items-center flex-1">
       <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                  ${isCompleted ? 'bg-primary-600 border-primary-600 text-white' : ''}
                  ${isCurrent ? 'bg-white border-primary-600 text-primary-600 scale-110 shadow-lg' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                `}
       >
        {isCompleted ? <Check size={20} /> : index + 1}
       </div>
       <span
        className={`mt-2 text-[10px] md:text-sm font-medium transition-colors duration-300
                  ${isCurrent ? 'text-primary-800' : 'text-gray-400'}
                `}
       >
        {labels[index]}
       </span>
      </div>
     );
    })}

    {/* Progress Line Background */}
    <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full" />

    {/* Progress Line Active */}
    <div
     className="absolute top-5 left-0 h-1 bg-primary-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
     style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
    />
   </div>
  </div>
 );
};