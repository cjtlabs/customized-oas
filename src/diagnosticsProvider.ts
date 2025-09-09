import * as vscode from 'vscode';
import { OpenAPIValidator } from './validator';
import { CustomExtension, ValidationResult } from './types';

export class OpenAPIDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private validator: OpenAPIValidator;

  constructor(context: vscode.ExtensionContext, customExtensions: CustomExtension[]) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('customized-oas');
    this.validator = new OpenAPIValidator(customExtensions);
    context.subscriptions.push(this.diagnosticCollection);
  }

  public validateDocument(document: vscode.TextDocument): void {
    if (!this.isOpenAPIFile(document)) {
      return;
    }

    if (document.fileName.endsWith('.git')) {
      return;
    }

    const content = document.getText();

    const result = this.validator.validateDocument(content);
    this.updateDiagnostics(document, result);
  }

  private isOpenAPIFile(document: vscode.TextDocument): boolean {
    // Check content for OpenAPI indicators
    const content = document.getText();
    const lines = content.split('\n').slice(0, 10); // Check first 10 lines

    for (const line of lines) {
      if (line.match(/^\s*openapi\s*:\s*['"]*3\./)) {
        return true;
      }
      if (line.match(/^\s*swagger\s*:\s*['"]*2\./)) {
        return true;
      }
    }

    return false;
  }

  private updateDiagnostics(document: vscode.TextDocument, result: ValidationResult): void {
    const diagnostics: vscode.Diagnostic[] = [];

    for (const error of result.errors) {
      const range = this.createRange(document, error.line, error.column);
      const diagnostic = new vscode.Diagnostic(
        range ??
          new vscode.Range(
            new vscode.Position(error.line! - 1, 0),
            new vscode.Position(error.line! - 1, 1000)
          ),
        error.message,
        error.severity === 'error'
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'Customized OAS';
      diagnostic.code = error.extensionName;
      diagnostics.push(diagnostic);
    }

    for (const warning of result.warnings) {
      const range = this.createRange(document, warning.line, warning.column);
      const diagnostic = new vscode.Diagnostic(
        range,
        warning.message,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'Customized OAS';
      diagnostic.code = warning.extensionName || 'warning';
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private createRange(document: vscode.TextDocument, line?: number, column?: number): vscode.Range {
    if (line === undefined) {
      return new vscode.Range(0, 0, 0, 0);
    }

    const lineIndex = Math.max(0, line - 1);
    const columnIndex = Math.max(0, (column || 1) - 1);

    if (lineIndex >= document.lineCount) {
      const lastLine = document.lineCount - 1;
      const lastLineText = document.lineAt(lastLine).text;
      return new vscode.Range(lastLine, lastLineText.length, lastLine, lastLineText.length);
    }

    const lineText = document.lineAt(lineIndex).text;
    const endColumn = Math.min(columnIndex + 20, lineText.length); // Highlight up to 20 chars or end of line

    return new vscode.Range(lineIndex, columnIndex, lineIndex, endColumn);
  }

  public updateRequiredExtensions(extensions: CustomExtension[]): void {
    this.validator.updateRequiredExtensions(extensions);

    // Re-validate all open OpenAPI documents
    vscode.workspace.textDocuments.forEach((document) => {
      if (this.isOpenAPIFile(document)) {
        this.validateDocument(document);
      }
    });
  }

  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
