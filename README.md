# Customized OpenAPI Specifications Extension

A VS Code extension that provides custom linting, validation, and autocompletion for OpenAPI specifications with configurable custom extensions.

## Features

### 🔍 Custom Extension Linting

- **Real-time validation** of required custom extensions in OpenAPI files
- **Error highlighting** with precise line and column information
- **Configurable extension requirements** through VS Code settings

### ✨ Smart Autocompletion

- **Intelligent suggestions** for custom extensions as you type
- **Type-aware snippets** that generate appropriate values based on extension type
- **Context-aware completion** that only triggers at the root level of OpenAPI documents

### ⚙️ Flexible Configuration

- **Define required extensions** with name, type, and description
- **Enable/disable features** independently (linting, autocompletion)
- **Dynamic configuration updates** without restarting VS Code

## Configuration

Add the following to your VS Code settings:

```json
{
  "cOAS.customExtensions": [
    {
      "name": "x-custom-field",
      "type": "string",
      "description": "Custom field name",
      "required": true
    },
    {
      "name": "x-custom-version",
      "type": "number",
      "description": "Custom version number",
      "required": false
    }
  ],
  "cOAS.enableLinting": true,
  "cOAS.enableAutocompletion": true
}
```

### Extension Configuration Properties

- **name**: Extension name (must start with `x-`)
- **type**: Expected value type (`string`, `number`, `boolean`, `object`, `array`)
- **description**: Description shown in autocompletion
- **required**: Whether the extension is mandatory (default: `true`)

## Commands

- **Validate OpenAPI Custom Extensions**: Manually validate the current file
- **Add Custom Extension**: Interactive command to add a new extension to the current file

Access via Command Palette (`Ctrl+Shift+P`) → "Customized OAS"

## File Support

The extension automatically detects OpenAPI files based on:

- File names containing "openapi" or "swagger"
- Content containing `openapi: 3.x` declarations
- File extensions: `.yaml`, `.yml`, `.json`

## Usage Examples

### Missing Required Extension

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
# ❌ Error: Missing required custom extension: x-custom-field
```

### Valid Configuration

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
x-custom-field: "My Custom API" # ✅ Required extension present
x-custom-version: 2 # ✅ Optional extension
```

### Autocompletion

Type `x-` at the root level to see available custom extensions with appropriate snippets.

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## Architecture

- **`validator.ts`**: Core validation logic for OpenAPI documents
- **`diagnosticsProvider.ts`**: VS Code diagnostics integration
- **`completionProvider.ts`**: Autocompletion functionality
- **`types.ts`**: TypeScript interfaces and types
- **`extension.ts`**: Main extension entry point

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18.x or higher
