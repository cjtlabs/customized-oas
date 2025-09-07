import * as YAML from "yaml";
import {
  ICustomExtension,
  IValidationResult,
  IValidationError,
  IOpenAPIDocument,
} from "./types";

export class OpenAPIValidator {
  private customExtensions: ICustomExtension[];

  constructor(customExtensions: ICustomExtension[]) {
    this.customExtensions = customExtensions;
  }

  public validateDocument(content: string): IValidationResult {
    const errors: IValidationError[] = [];
    let document: IOpenAPIDocument;

    try {
      document = YAML.parse(content);
    } catch (parseError) {
      return {
        isValid: false,
        errors: [
          {
            message: `Failed to parse YAML: ${parseError}`,
            extensionName: "parse-error",
            severity: "error",
          },
        ],
        warnings: [],
      };
    }

    // Validate OpenAPI structure
    if (!document.openapi) {
      errors.push({
        message: 'Missing required "openapi" field',
        extensionName: "openapi-structure",
        severity: "error",
      });
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
            severity: "error",
          });
        } else {
          // Validate extension type
          const value = document[extension.name];
          if (!this.validateExtensionType(value, extension.type)) {
            const location = this.findExtensionLocation(
              content,
              extension.name
            );
            errors.push({
              message: `Extension ${extension.name} should be of type ${
                extension.type
              }, got ${typeof value}`,
              line: location?.line,
              column: location?.column,
              extensionName: extension.name,
              severity: "error",
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

  private hasExtension(
    document: IOpenAPIDocument,
    extensionName: string
  ): boolean {
    return document.hasOwnProperty(extensionName);
  }

  private validateExtensionType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "array":
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
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(
        new RegExp(
          `^\\s*${extensionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`
        )
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

  public getRequiredExtensions(): ICustomExtension[] {
    return this.customExtensions;
  }

  public updateRequiredExtensions(extensions: ICustomExtension[]): void {
    this.customExtensions = extensions;
  }
}
