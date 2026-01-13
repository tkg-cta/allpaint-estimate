import React from 'react';

interface StepWizardProps {
 currentStep: number;
 children: React.ReactNode;
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, children }) => {
 const steps = React.Children.toArray(children);
 const activeStep = steps[currentStep];

 return (
  <div className="w-full">
   {activeStep}
  </div>
 );
};