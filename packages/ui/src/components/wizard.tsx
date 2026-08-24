"use client";

import React from "react";
import { AppIcon } from "./icon/AppIcon";
import { Button } from "./button";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  isValid?: boolean; // Can this step be passed?
}

export interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  isSubmitting = false,
  submitLabel = "Complete",
  cancelLabel = "Cancel",
}: WizardProps) {
  
  const handleNext = () => {
    if (currentStep < steps.length - 1 && (steps[currentStep].isValid !== false)) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const isCurrentStepValid = steps[currentStep]?.isValid !== false;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Stepper Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 shrink-0">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 border-primary-600 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-500' 
                      : isPast
                        ? 'bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
                        : 'bg-white text-neutral-400 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700'
                  }`}>
                    {isPast ? <AppIcon name="check" size="sm" /> : (index + 1)}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-sm font-bold ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-px mx-2 ${isPast ? 'bg-primary-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          {steps[currentStep]?.content}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 shrink-0">
        <div>
          {onCancel && currentStep === 0 && (
            <Button variant="ghost" onClick={onCancel} className="text-neutral-600">
              {cancelLabel}
            </Button>
          )}
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
              <AppIcon name="chevronLeft" className="w-4 h-4 mr-1.5" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext} 
              disabled={!isCurrentStepValid}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Next Step
              <AppIcon name="chevronRight" className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button 
              onClick={onComplete} 
              disabled={!isCurrentStepValid || isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <AppIcon name="loading" className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
