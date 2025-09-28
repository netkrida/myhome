"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormPersistence } from "@/lib/form-persistence";

// Types
export interface Step {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  isValid?: boolean;
  isOptional?: boolean;
}

interface MultiStepFormContextType {
  currentStep: number;
  steps: Step[];
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  setStepValid: (stepIndex: number, isValid: boolean) => void;
  canProceed: boolean;
}

// Context
const MultiStepFormContext = createContext<MultiStepFormContextType | undefined>(undefined);

export function useMultiStepForm() {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error("useMultiStepForm must be used within a MultiStepFormProvider");
  }
  return context;
}

// Provider Props
interface MultiStepFormProviderProps {
  children: ReactNode;
  steps: Step[];
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
  persistenceKey?: string;
  enablePersistence?: boolean;
}

// Provider Component
export function MultiStepFormProvider({
  children,
  steps: initialSteps,
  onComplete,
  onStepChange,
  persistenceKey = "multi-step-form",
  enablePersistence = false,
}: MultiStepFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(initialSteps);
  const [hasLoadedPersistedStep, setHasLoadedPersistedStep] = useState(false);

  // Load persisted step on mount
  useEffect(() => {
    if (enablePersistence && !hasLoadedPersistedStep) {
      const persistedStep = FormPersistence.loadCurrentStep({
        key: persistenceKey,
        useSessionStorage: true,
      });

      if (persistedStep !== null && persistedStep >= 0 && persistedStep < initialSteps.length) {
        setCurrentStep(persistedStep);
        console.log(`📍 Restored to step ${persistedStep} from persistence`);
      }

      setHasLoadedPersistedStep(true);
    }
  }, [enablePersistence, hasLoadedPersistedStep, persistenceKey, initialSteps.length]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];
  const canProceed = currentStepData?.isValid !== false;

  const nextStep = useCallback(() => {
    if (!isLastStep && canProceed) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);

      // Save step to persistence
      if (enablePersistence) {
        FormPersistence.saveCurrentStep({
          key: persistenceKey,
          useSessionStorage: true,
        }, newStep);
      }

      onStepChange?.(newStep);
    } else if (isLastStep && canProceed) {
      // Clear persistence on completion
      if (enablePersistence) {
        FormPersistence.clearCurrentStep({
          key: persistenceKey,
          useSessionStorage: true,
        });
      }
      onComplete?.();
    }
  }, [isLastStep, canProceed, currentStep, onStepChange, onComplete, enablePersistence, persistenceKey]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);

      // Save step to persistence
      if (enablePersistence) {
        FormPersistence.saveCurrentStep({
          key: persistenceKey,
          useSessionStorage: true,
        }, newStep);
      }

      onStepChange?.(newStep);
    }
  }, [isFirstStep, currentStep, onStepChange, enablePersistence, persistenceKey]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  }, [steps.length, onStepChange]);

  const setStepValid = useCallback((stepIndex: number, isValid: boolean) => {
    console.log(`🔄 MultiStepForm - setStepValid called: step ${stepIndex} = ${isValid}`);
    setSteps(prev => {
      // Check if the validity has actually changed
      const currentStep = prev[stepIndex];
      console.log(`🔍 MultiStepForm - Current step ${stepIndex}:`, currentStep);
      console.log(`🔍 MultiStepForm - Current validity: ${currentStep?.isValid} -> ${isValid}`);
      
      if (!currentStep || currentStep.isValid === isValid) {
        console.log(`🔍 MultiStepForm - No change needed for step ${stepIndex}`);
        return prev; // No change needed
      }
      
      const newSteps = prev.map((step, index) =>
        index === stepIndex ? { ...step, isValid } : step
      );
      
      console.log(`✅ MultiStepForm - Updated steps:`, newSteps.map(s => ({ 
        id: s.id, 
        isValid: s.isValid 
      })));
      
      return newSteps;
    });
  }, []);

  const value: MultiStepFormContextType = useMemo(() => ({
    currentStep,
    steps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    goToStep,
    setStepValid,
    canProceed,
  }), [currentStep, steps, isFirstStep, isLastStep, nextStep, prevStep, goToStep, setStepValid, canProceed]);

  return (
    <MultiStepFormContext.Provider value={value}>
      {children}
    </MultiStepFormContext.Provider>
  );
}

// Step Indicator Component
interface StepIndicatorProps {
  className?: string;
}

export function StepIndicator({ className }: StepIndicatorProps) {
  const { currentStep, steps } = useMultiStepForm();
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step List */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isValid = step.isValid !== false;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium",
                isActive && "bg-primary-foreground text-primary",
                isCompleted && "bg-green-600 text-white",
                !isActive && !isCompleted && "bg-muted-foreground text-muted"
              )}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Step Content Component
interface StepContentProps {
  className?: string;
}

export function StepContent({ className }: StepContentProps) {
  const { currentStep, steps } = useMultiStepForm();
  const currentStepData = steps[currentStep];

  if (!currentStepData) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{currentStepData.title}</CardTitle>
        {currentStepData.description && (
          <CardDescription>{currentStepData.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {currentStepData.component}
      </CardContent>
    </Card>
  );
}

// Navigation Component
interface StepNavigationProps {
  className?: string;
  showStepInfo?: boolean;
  nextButtonText?: string;
  prevButtonText?: string;
  finishButtonText?: string;
}

export function StepNavigation({
  className,
  showStepInfo = true,
  nextButtonText = "Next",
  prevButtonText = "Previous", 
  finishButtonText = "Finish",
}: StepNavigationProps) {
  const { 
    currentStep, 
    steps, 
    isFirstStep, 
    isLastStep, 
    nextStep, 
    prevStep, 
    canProceed 
  } = useMultiStepForm();

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {prevButtonText}
        </Button>

        {showStepInfo && (
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        )}
      </div>

      <Button
        type="button"
        onClick={() => {
          console.log(`🎯 Next button clicked - canProceed: ${canProceed}, currentStep: ${currentStep}`);
          console.log(`🎯 Current step data:`, steps[currentStep]);
          nextStep();
        }}
        disabled={!canProceed}
        className="flex items-center gap-2"
      >
        {isLastStep ? finishButtonText : nextButtonText}
        {!isLastStep && <ChevronRight className="w-4 h-4" />}
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs opacity-75">
            {canProceed ? "✓" : "✗"}
          </span>
        )}
      </Button>
    </div>
  );
}

// Main Multi-Step Form Component
interface MultiStepFormProps {
  steps: Step[];
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
  children?: ReactNode;
  persistenceKey?: string;
  enablePersistence?: boolean;
}

export function MultiStepForm({
  steps,
  onComplete,
  onStepChange,
  className,
  children,
  persistenceKey,
  enablePersistence,
}: MultiStepFormProps) {
  return (
    <MultiStepFormProvider
      steps={steps}
      onComplete={onComplete}
      onStepChange={onStepChange}
      persistenceKey={persistenceKey}
      enablePersistence={enablePersistence}
    >
      <div className={cn("space-y-6", className)}>
        <StepIndicator />
        <StepContent />
        {children}
        <StepNavigation />
      </div>
    </MultiStepFormProvider>
  );
}
