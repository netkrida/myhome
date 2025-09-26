"use client";

import { useCallback, useMemo } from "react";

/**
 * Form persistence utilities for maintaining form state across page refreshes
 * and navigation. Uses localStorage for persistence and sessionStorage for
 * temporary state management.
 */

export interface FormPersistenceOptions {
  key: string;
  version?: string;
  expirationHours?: number;
  useSessionStorage?: boolean;
}

export interface PersistedFormData {
  data: any;
  timestamp: number;
  version: string;
  currentStep?: number;
}

export class FormPersistence {
  private static readonly DEFAULT_EXPIRATION_HOURS = 24;
  private static readonly DEFAULT_VERSION = "1.0";

  /**
   * Save form data to storage
   */
  static saveFormData<T>(
    data: T,
    options: FormPersistenceOptions,
    currentStep?: number
  ): void {
    if (typeof window === "undefined") return;

    try {
      const persistedData: PersistedFormData = {
        data,
        timestamp: Date.now(),
        version: options.version || this.DEFAULT_VERSION,
        currentStep,
      };

      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      storage.setItem(options.key, JSON.stringify(persistedData));

      console.log(`📝 Form data saved to ${options.useSessionStorage ? 'session' : 'local'}Storage:`, options.key);
    } catch (error) {
      console.error("Failed to save form data:", error);
    }
  }

  /**
   * Load form data from storage
   */
  static loadFormData<T>(options: FormPersistenceOptions): {
    data: T | null;
    currentStep?: number;
    isExpired: boolean;
  } {
    if (typeof window === "undefined") {
      return { data: null, isExpired: false };
    }

    try {
      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      const stored = storage.getItem(options.key);

      if (!stored) {
        return { data: null, isExpired: false };
      }

      const persistedData: PersistedFormData = JSON.parse(stored);

      // Check version compatibility
      const expectedVersion = options.version || this.DEFAULT_VERSION;
      if (persistedData.version !== expectedVersion) {
        console.warn(`Form data version mismatch. Expected: ${expectedVersion}, Found: ${persistedData.version}`);
        this.clearFormData(options);
        return { data: null, isExpired: false };
      }

      // Check expiration
      const expirationMs = (options.expirationHours || this.DEFAULT_EXPIRATION_HOURS) * 60 * 60 * 1000;
      const isExpired = Date.now() - persistedData.timestamp > expirationMs;

      if (isExpired) {
        console.log("Form data expired, clearing...");
        this.clearFormData(options);
        return { data: null, isExpired: true };
      }

      console.log(`📖 Form data loaded from ${options.useSessionStorage ? 'session' : 'local'}Storage:`, options.key);
      return {
        data: persistedData.data as T,
        currentStep: persistedData.currentStep,
        isExpired: false,
      };
    } catch (error) {
      console.error("Failed to load form data:", error);
      return { data: null, isExpired: false };
    }
  }

  /**
   * Clear form data from storage
   */
  static clearFormData(options: FormPersistenceOptions): void {
    if (typeof window === "undefined") return;

    try {
      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      storage.removeItem(options.key);
      console.log(`🗑️ Form data cleared from ${options.useSessionStorage ? 'session' : 'local'}Storage:`, options.key);
    } catch (error) {
      console.error("Failed to clear form data:", error);
    }
  }

  /**
   * Check if form data exists in storage
   */
  static hasFormData(options: FormPersistenceOptions): boolean {
    if (typeof window === "undefined") return false;

    try {
      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      return storage.getItem(options.key) !== null;
    } catch (error) {
      console.error("Failed to check form data existence:", error);
      return false;
    }
  }

  /**
   * Save current step information
   */
  static saveCurrentStep(options: FormPersistenceOptions, step: number): void {
    if (typeof window === "undefined") return;

    try {
      const stepKey = `${options.key}_current_step`;
      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      storage.setItem(stepKey, step.toString());
      console.log(`📍 Current step saved: ${step}`);
    } catch (error) {
      console.error("Failed to save current step:", error);
    }
  }

  /**
   * Load current step information
   */
  static loadCurrentStep(options: FormPersistenceOptions): number | null {
    if (typeof window === "undefined") return null;

    try {
      const stepKey = `${options.key}_current_step`;
      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      const stored = storage.getItem(stepKey);
      
      if (stored) {
        const step = parseInt(stored, 10);
        console.log(`📍 Current step loaded: ${step}`);
        return isNaN(step) ? null : step;
      }
      
      return null;
    } catch (error) {
      console.error("Failed to load current step:", error);
      return null;
    }
  }

  /**
   * Clear current step information
   */
  static clearCurrentStep(options: FormPersistenceOptions): void {
    if (typeof window === "undefined") return;

    try {
      const stepKey = `${options.key}_current_step`;
      const storage = options.useSessionStorage ? sessionStorage : localStorage;
      storage.removeItem(stepKey);
      console.log("📍 Current step cleared");
    } catch (error) {
      console.error("Failed to clear current step:", error);
    }
  }

  /**
   * Get all form keys from storage (for debugging)
   */
  static getAllFormKeys(prefix?: string): string[] {
    if (typeof window === "undefined") return [];

    try {
      const keys: string[] = [];
      
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (!prefix || key.startsWith(prefix))) {
          keys.push(`localStorage: ${key}`);
        }
      }
      
      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (!prefix || key.startsWith(prefix))) {
          keys.push(`sessionStorage: ${key}`);
        }
      }
      
      return keys;
    } catch (error) {
      console.error("Failed to get form keys:", error);
      return [];
    }
  }

  /**
   * Clear all form data with a specific prefix
   */
  static clearAllFormData(prefix: string): void {
    if (typeof window === "undefined") return;

    try {
      // Clear from localStorage
      const localKeys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      localKeys.forEach(key => localStorage.removeItem(key));
      
      // Clear from sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(prefix));
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
      
      console.log(`🗑️ Cleared ${localKeys.length + sessionKeys.length} form data items with prefix: ${prefix}`);
    } catch (error) {
      console.error("Failed to clear all form data:", error);
    }
  }
}

/**
 * React hook for form persistence
 */
export function useFormPersistence<T>(
  options: FormPersistenceOptions,
  initialData?: T
) {
  const saveData = useCallback((data: T, currentStep?: number) => {
    FormPersistence.saveFormData(data, options, currentStep);
  }, [options]);

  const loadData = useCallback(() => {
    return FormPersistence.loadFormData<T>(options);
  }, [options]);

  const clearData = useCallback(() => {
    FormPersistence.clearFormData(options);
    FormPersistence.clearCurrentStep(options);
  }, [options]);

  const saveStep = useCallback((step: number) => {
    FormPersistence.saveCurrentStep(options, step);
  }, [options]);

  const loadStep = useCallback(() => {
    return FormPersistence.loadCurrentStep(options);
  }, [options]);

  const hasData = useMemo(() => {
    return FormPersistence.hasFormData(options);
  }, [options]);

  return useMemo(() => ({
    saveData,
    loadData,
    clearData,
    saveStep,
    loadStep,
    hasData,
  }), [saveData, loadData, clearData, saveStep, loadStep, hasData]);
}
