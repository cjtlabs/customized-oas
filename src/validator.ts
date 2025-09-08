import * as YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../schemas/openapi-specification.json';
import { CustomExtension, ValidationResult, ValidationError, OpenAPIDocument } from './types';

export class OpenAPIValidator {
  private customExtensions: CustomExtension[];

  constructor(customExtensions: CustomExtension[]) {
    this.customExtensions = customExtensions;
  }

  public validateDocument(content: string): ValidationResult {
    const errors: ValidationError[] = [];
    let document: OpenAPIDocument;

    try {
      document = YAML.parse(content);
    } catch (parseError) {
      return {
        isValid: false,
        errors: [
          {
            message: `Failed to parse YAML: ${parseError}`,
            extensionName: 'parse-error',
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }

    // Validate OpenAPI structure
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv); // handles email, uri, etc.
    const validate = ajv.compile(schema);

    const valid = validate(document);
    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        errors.push({
          message: `Schema validation error at ${err.instancePath || '/'}: ${err.message}`,
          extensionName: 'schema-validation',
          severity: 'error',
        });
      }
    }

    // Validate required custom extensions
    for (const extension of this.customExtensions) {
      if (extension.required !== false) {
        const hasExtension = this.hasExtension(document, extension.name);
        if (!hasExtension) {
          const location = this.findExtensionLocation(content, extension.name);
          errors.push({
            message: `Missing required custom extension: ${extension.name}`,
            line: location?.line,
            column: location?.column,
            extensionName: extension.name,
            severity: 'error',
          });
        } else {
          // Validate extension type
          const value = document[extension.name];
          if (!this.validateExtensionType(value, extension.type)) {
            const location = this.findExtensionLocation(content, extension.name);
            errors.push({
              message: `Extension ${extension.name} should be of type ${
                extension.type
              }, got ${typeof value}`,
              line: location?.line,
              column: location?.column,
              extensionName: extension.name,
              severity: 'error',
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  private hasExtension(document: OpenAPIDocument, extensionName: string): boolean {
    return document.hasOwnProperty(extensionName);
  }

  private validateExtensionType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  private findExtensionLocation(
    content: string,
    extensionName: string
  ): { line: number; column: number } | null {
    return this.findYamlLocation(content, extensionName);
  }

  private findYamlLocation(
    content: string,
    extensionName: string
  ): { line: number; column: number } | null {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(
        new RegExp(`^\\s*${extensionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`)
      );
      if (match) {
        return { line: i + 1, column: match.index! + 1 };
      }
    }

    // If not found, return location for root level (where it should be added)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^openapi\s*:/)) {
        return { line: i + 2, column: 1 }; // After openapi line
      }
    }

    return { line: 1, column: 1 };
  }

  public getRequiredExtensions(): CustomExtension[] {
    return this.customExtensions;
  }

  public updateRequiredExtensions(extensions: CustomExtension[]): void {
    this.customExtensions = extensions;
  }
}
