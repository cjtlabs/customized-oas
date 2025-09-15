import * as vscode from 'vscode';
import * as YAML from 'yaml';
import { CustomExtension, OpenAPIDocument } from './types';
import { ExtensionLocationEnum } from './validator/enums';

export class OpenAPICompletionProvider implements vscode.CompletionItemProvider {
  private customExtensions: CustomExtension[];

  constructor(customExtensions: CustomExtension[]) {
    this.customExtensions = customExtensions;
  }

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);

    // Check if we're typing an extension (starts with 'x-')
    const extensionMatch = linePrefix.match(/^\s*(x-[\w-]*)?$/);
    if (!extensionMatch) {
      return [];
    }

    // Determine the current context/location in the OpenAPI document
    const currentLocation = this.determineExtensionLocation(document, position);
    if (!currentLocation) {
      return [];
    }

    const completionItems: vscode.CompletionItem[] = [];

    // Filter extensions based on current location
    const relevantExtensions = this.customExtensions.filter(
      extension => extension.in === currentLocation
    );

    for (const extension of relevantExtensions) {
      const item = new vscode.CompletionItem(extension.name, vscode.CompletionItemKind.Property);
      item.detail = `Custom Extension (${extension.type}) - ${extension.in}`;
      item.documentation = new vscode.MarkdownString(
        extension.description || `Custom extension of type ${extension.type} for ${extension.in} section`
      );

      // Create appropriate snippet based on type
      const snippet = this.createSnippet(extension);
      item.insertText = new vscode.SnippetString(snippet);

      // Create precise range for replacement
      const range = this.createReplacementRange(document, position, linePrefix);
      if (range) {
        item.range = range;
      }

      // Add sorting priority for required extensions
      item.sortText = extension.required !== false ? '0' + extension.name : '1' + extension.name;

      completionItems.push(item);
    }

    return completionItems;
  }

  private determineExtensionLocation(document: vscode.TextDocument, position: vscode.Position): string | null {
    const content = document.getText();
    let parsedDoc: OpenAPIDocument;

    try {
      parsedDoc = YAML.parse(content);
    } catch (error) {
      return null;
    }

    // Get the current path in the YAML structure
    const yamlPath = this.getYamlPath(document, position);
    
    // Determine location based on YAML path context
    if (yamlPath.length === 0) {
      return ExtensionLocationEnum.Root;
    }

    // Check for specific contexts in order of specificity
    if (yamlPath.includes('requestBody')) {
      return ExtensionLocationEnum.RequestBody;
    }

    if (yamlPath.includes('parameters')) {
      return ExtensionLocationEnum.Parameters;
    }

    if (yamlPath.includes('servers')) {
      return ExtensionLocationEnum.Servers;
    }

    if (yamlPath.includes('tags')) {
      return ExtensionLocationEnum.Tags;
    }

    // Check if we're in a paths section but not in a specific operation context
    if (yamlPath.includes('paths') && !this.isInOperationContext(yamlPath)) {
      return ExtensionLocationEnum.Root;
    }

    // Default to root for top-level extensions
    return ExtensionLocationEnum.Root;
  }

  private isInOperationContext(yamlPath: string[]): boolean {
    const httpMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];
    return yamlPath.some(part => httpMethods.includes(part.toLowerCase()));
  }

  private getYamlPath(document: vscode.TextDocument, position: vscode.Position): string[] {
    const lines = document.getText().split('\n');
    const path: string[] = [];
    let currentIndentation = this.getIndentation(lines[position.line]);

    // Walk backwards from current position to build the path
    for (let i = position.line; i >= 0; i--) {
      const line = lines[i];
      const indentation = this.getIndentation(line);
      const trimmed = line.trim();

      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }

      // If this line has less or equal indentation, it could be a parent
      if (indentation <= currentIndentation) {
        const match = trimmed.match(/^(?:-\s+)?([A-Za-z0-9_\-]+)\s*:/);
        if (match) {
          const key = match[1];
          // Only add to path if it's not already there (avoid duplicates)
          if (!path.includes(key)) {
            path.unshift(key);
          }
          currentIndentation = indentation;
        }
      }
    }

    return path;
  }

  private getIndentation(line: string): number {
    const match = line.match(/^(\s*)\S/);
    return match ? match[1].length : 0;
  }

  private createReplacementRange(document: vscode.TextDocument, position: vscode.Position, linePrefix: string): vscode.Range | undefined {
    // Find the 'x-' prefix to replace
    const match = linePrefix.match(/(x-[\w-]*)$/);
    if (match) {
      const startPos = new vscode.Position(position.line, position.character - match[1].length);
      return new vscode.Range(startPos, position);
    }

    // If no existing 'x-' prefix, just insert at current position
    return undefined;
  }

  private createSnippet(extension: CustomExtension): string {
    switch (extension.type) {
      case 'string':
        return `${extension.name}: "\${1:value}"`;
      case 'number':
        return `${extension.name}: \${1:0}`;
      case 'boolean':
        return `${extension.name}: \${1|true,false|}`;
      case 'object':
        return `${extension.name}:\n  \${1:key}: \${2:value}`;
      case 'array':
        return `${extension.name}:\n  - \${1:item}`;
      default:
        return '';
    }
  }

  public updateRequiredExtensions(extensions: CustomExtension[]): void {
    this.customExtensions = extensions;
  }
}
