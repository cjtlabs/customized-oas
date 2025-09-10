import * as vscode from 'vscode';
import { CustomExtension } from './types';

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

    // Check if we're at the root level of the document
    if (!this.isAtRootLevel(document, position)) {
      return [];
    }

    // Check if we're typing an extension (starts with 'x-')
    const extensionMatch = linePrefix.match(/^\s*(x-[\w-]*)?$/);
    if (!extensionMatch) {
      return [];
    }

    const completionItems: vscode.CompletionItem[] = [];

    for (const extension of this.customExtensions) {
      const item = new vscode.CompletionItem(extension.name, vscode.CompletionItemKind.Property);
      item.detail = `Custom Extension (${extension.type})`;
      item.documentation = new vscode.MarkdownString(
        extension.description || `Custom extension of type ${extension.type}`
      );

      // Create appropriate snippet based on type
      const snippet = this.createSnippet(extension);
      item.insertText = new vscode.SnippetString(snippet);

      // Replace the trigger keys (x-) with selected suggestions
      const range = document.getWordRangeAtPosition(position, /x-[\w-]*/);
      if (range) {
        item.range = range;
      }

      // Add sorting priority for required extensions
      item.sortText = extension.required !== false ? '0' + extension.name : '1' + extension.name;

      completionItems.push(item);
    }

    return completionItems;
  }

  private isAtRootLevel(document: vscode.TextDocument, position: vscode.Position): boolean {
    // Check if we're at the root level by examining indentation
    const lineText = document.lineAt(position).text;
    const indentation = lineText.match(/^\s*/)?.[0] || '';

    // Root level should have no indentation or minimal indentation
    if (indentation.length > 2) {
      return false;
    }

    // Look for OpenAPI structure indicators
    const content = document.getText();
    const lines = content.split('\n');

    // Check if we're after the openapi/info section but before paths
    let foundOpenAPI = false;
    let foundPaths = false;

    for (let i = 0; i < position.line; i++) {
      const line = lines[i];
      if (line.match(/^openapi\s*:/)) {
        foundOpenAPI = true;
      }
      if (line.match(/^paths\s*:/)) {
        foundPaths = true;
        break;
      }
    }

    return foundOpenAPI && !foundPaths;
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
