import { useState } from 'react';

export type ValidationRule = (value: any) => string | undefined;

export function useForm<T extends Record<string, any>>(
  initialValues: T, 
  validations: Partial<Record<keyof T, ValidationRule[]>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const key in validations) {
      const rules = validations[key];
      if (rules) {
        for (const rule of rules) {
          const errorMessage = rule(values[key]);
          if (errorMessage) {
            newErrors[key] = errorMessage;
            isValid = false;
            break; // Stop at first error for each field
          }
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (key: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing again
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  return { 
    values, 
    errors, 
    handleChange, 
    validate, 
    setErrors, 
    setValues,
    isSubmitting,
    setIsSubmitting
  };
}

// Common Validation Rules
export const validators = {
  required: (msg: string): ValidationRule => (val) => 
    (!val || (typeof val === 'string' && val.trim() === '')) ? msg : undefined,
  
  email: (msg: string): ValidationRule => (val) => 
    !/\S+@\S+\.\S+/.test(val) ? msg : undefined,
  
  minLength: (min: number, msg: string): ValidationRule => (val) => 
    (val && val.length < min) ? msg : undefined,
  
  positiveNumber: (msg: string): ValidationRule => (val) => 
    (isNaN(val) || val <= 0) ? msg : undefined,
};
