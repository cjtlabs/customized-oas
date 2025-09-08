export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  message: string;
  line?: number;
  column?: number;
  extensionName: string;
  severity: 'error' | 'warning';
};

type ValidationWarning = {
  message: string;
  line?: number;
  column?: number;
  extensionName?: string;
};
