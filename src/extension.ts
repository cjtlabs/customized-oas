import * as vscode from "vscode";
import { OpenAPIDiagnosticsProvider } from "./diagnosticsProvider";
import { OpenAPICompletionProvider } from "./completionProvider";
import { ICustomExtension } from "./types";

let diagnosticsProvider: OpenAPIDiagnosticsProvider;
let completionProvider: OpenAPICompletionProvider;

export function activate(context: vscode.ExtensionContext) {
  try {
    // Load configuration
    const config = vscode.workspace.getConfiguration("cOAS");
    const customExtensions: ICustomExtension[] =
      config.get("customExtensions") ?? [];
    const enableLinting: boolean = config.get("enableLinting") ?? true;
    const enableAutocompletion: boolean =
      config.get("enableAutocompletion") ?? true;

    // Initialize diagnostics provider
    if (enableLinting) {
      diagnosticsProvider = new OpenAPIDiagnosticsProvider(
        context,
        customExtensions
      );

      // Validate documents on open and change
      const validateDocument = (document: vscode.TextDocument) => {
        diagnosticsProvider.validateDocument(document);
      };

      context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(validateDocument),
        vscode.workspace.onDidChangeTextDocument((e) =>
          validateDocument(e.document)
        ),
        vscode.workspace.onDidSaveTextDocument(validateDocument)
      );

      // Validate already open documents
      vscode.workspace.textDocuments.forEach(validateDocument);
    }

    // Initialize completion provider
    if (enableAutocompletion) {
      completionProvider = new OpenAPICompletionProvider(customExtensions);

      context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
          ["yaml", "yml"],
          completionProvider,
          "x",
          "-" // Trigger on 'x' and '-' for x- extensions
        )
      );
    }

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand("cOAS.validateFile", () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && diagnosticsProvider) {
          diagnosticsProvider.validateDocument(activeEditor.document);
          vscode.window.showInformationMessage("OpenAPI validation completed");
        } else {
          vscode.window.showWarningMessage(
            "No active OpenAPI file to validate"
          );
        }
      }),

      vscode.commands.registerCommand("cOAS.addExtension", async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          vscode.window.showWarningMessage("No active file");
          return;
        }

        const extensionName = await vscode.window.showInputBox({
          prompt: "Enter extension name (e.g., x-custom-extension)",
          validateInput: (value) => {
            if (!value.startsWith("x-")) {
              return 'Extension name must start with "x-"';
            }
            return null;
          },
        });

        if (extensionName) {
          const extensionType = await vscode.window.showQuickPick(
            ["string", "number", "boolean", "object", "array"],
            { placeHolder: "Select extension type" }
          );

          if (extensionType) {
            await addExtensionToDocument(
              activeEditor,
              extensionName,
              extensionType
            );
          }
        }
      })
    );

    // Listen for configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("cOAS")) {
          const newConfig = vscode.workspace.getConfiguration("cOAS");
          const newExtensions: ICustomExtension[] =
            newConfig.get("customExtensions") ?? [];

          if (diagnosticsProvider) {
            diagnosticsProvider.updateRequiredExtensions(newExtensions);
          }
          if (completionProvider) {
            completionProvider.updateRequiredExtensions(newExtensions);
          }

          console.log("Customized OAS: Configuration updated", newExtensions);
        }
      })
    );

    vscode.window.showInformationMessage("Customized OAS Linter Activated");
  } catch (error) {
    console.error("Extension activation failed:", error);
    vscode.window.showErrorMessage(
      `Customized OAS activation failed: ${error}`
    );
  }
}

async function addExtensionToDocument(
  editor: vscode.TextEditor,
  extensionName: string,
  extensionType: string
): Promise<void> {
  const document = editor.document;
  const content = document.getText();

  // Find insertion point (after openapi and info sections)
  const lines = content.split("\n");
  let insertLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^info\s*:/)) {
      // Find the end of the info section
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine.match(/^[a-zA-Z]/)) {
          insertLine = j;
          break;
        }
      }
      break;
    }
  }

  // Create extension snippet
  let extensionSnippet: string;
  switch (extensionType) {
    case "string":
      extensionSnippet = `${extensionName}: "value"`;
      break;
    case "number":
      extensionSnippet = `${extensionName}: 0`;
      break;
    case "boolean":
      extensionSnippet = `${extensionName}: true`;
      break;
    case "object":
      extensionSnippet = `${extensionName}:\n  key: value`;
      break;
    case "array":
      extensionSnippet = `${extensionName}:\n  - item`;
      break;
    default:
      extensionSnippet = `${extensionName}: value`;
  }

  const position = new vscode.Position(insertLine, 0);
  await editor.edit((editBuilder) => {
    editBuilder.insert(position, extensionSnippet + "\n");
  });
}

export function deactivate() {
  if (diagnosticsProvider) {
    diagnosticsProvider.dispose();
  }
}
