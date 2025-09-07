export interface ICustomExtension {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required?: boolean;
}

export interface IValidationResult {
  isValid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
}

export interface IValidationError {
  message: string;
  line?: number;
  column?: number;
  extensionName: string;
  severity: "error" | "warning";
}

export interface IValidationWarning {
  message: string;
  line?: number;
  column?: number;
  extensionName?: string;
}

export interface IOpenAPIDocument {
  openapi: string;
  info: any;
  paths?: any;
  [key: string]: any;
}
