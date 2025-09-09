import * as YAML from 'yaml';
import * as vscode from 'vscode';
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
    const ajv = new Ajv({ allErrors: true, strict: false, verbose: true });
    addFormats(ajv); // handles email, uri, etc.
    const validate = ajv.compile(schema);

    const valid = validate(document);
    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        const location = this.findExtensionLocation(content, err.instancePath);

        const property = (err.params as any)?.additionalProperty;
        let range: vscode.Range | undefined;

        if (location && property) {
          // highlight just the property key
          const lineText = content.split('\n')[location.line - 1];
          const startCol = lineText.indexOf(property);
          if (startCol >= 0) {
            const pos = new vscode.Position(location.line - 1, startCol);
            range = new vscode.Range(pos, pos.translate(0, property.length));
          }
        }

        errors.push({
          message: `Schema validation error: Property "${property}" is not allowed at ${err.instancePath || '/'}`,
          line: location?.line,
          column: location?.column,
          extensionName: 'schema-validation',
          severity: 'error',
          range,
        });
      }
    }

    // Validate required custom extensions
    for (const extension of this.customExtensions) {
      if (extension.required !== false) {
        const hasExtension = this.hasExtension(document, extension.name);
        const location = this.findExtensionLocation(content, extension.name);
        if (!hasExtension) {
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
    extensionPath: string
  ): { line: number; column: number } | null {
    const lines = content.split('\n');
    const pathParts = extensionPath.split('/').filter((part) => part.length > 0);

    let depth = 0;
    let arrayIndex = -1; // track current array index when inside `-`

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if this line starts an array item
      const arrayItemMatch = trimmed.match(/^- /);
      if (arrayItemMatch) {
        arrayIndex++;
        // If the current pathPart is an index, check it
        if (String(arrayIndex) === pathParts[depth]) {
          depth++;
          if (depth === pathParts.length) {
            return { line: i + 1, column: this.getIndentation(line) + 3 };
          }
        }
      }

      // Match a mapping key (with or without "- " prefix)
      const match = trimmed.match(/^(?:-\s+)?([A-Za-z0-9_\-]+)\s*:/);
      if (match) {
        const key = match[1];
        if (key === pathParts[depth]) {
          depth++;
          if (depth === pathParts.length) {
            return { line: i + 1, column: this.getIndentation(line) + 1 };
          }
        }
      }

      // Reset arrayIndex when indentation decreases (new block)
      if (this.getIndentation(line) === 0) {
        arrayIndex = -1;
      }
    }

    return null;
  }

  private getIndentation(line: string): number {
    const match = line.match(/^(\s*)\S/);
    return match ? match[1].length : 0;
  }

  public getRequiredExtensions(): CustomExtension[] {
    return this.customExtensions;
  }

  public updateRequiredExtensions(extensions: CustomExtension[]): void {
    this.customExtensions = extensions;
  }
}
