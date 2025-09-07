# TODO List for OpenAPI Custom Extension Validator

## Features to Implement

### 1. [PRIORITY] Integration with Official OpenAPI 3.1.x Schema
- **Description**: Hookup to official OAS 3.1.x schema for validating native OpenAPI properties
- **Benefits**:
  - Validate all standard OpenAPI properties (not just custom extensions)
  - Ensure compliance with OpenAPI specification
  - Catch structural errors and invalid property values
- **Implementation Ideas**:
  - Use @apidevtools/openapi-schemas or similar package
  - Integrate JSON Schema validation with existing diagnostics
  - Combine native OAS validation with custom extension validation
  - Show different error severity levels (OAS errors vs custom extension warnings)
  - Support for both OpenAPI 3.0.x and 3.1.x specifications

### 2. Conditional Required Properties
- **Description**: Make certain properties required when a specific custom extension is present
- **Example**: If `x-alloy-displayName` is added to an operation, require `x-alloy-description` to also be present
- **Implementation Ideas**:
  - Add conditional validation rules in validator.ts
  - Support configuration for extension dependencies
  - Show appropriate error messages when dependent extensions are missing

### 3. Custom Extension Context Mapping
- **Description**: Support custom extensions in different OpenAPI objects beyond paths/operations
- **Contexts to Support**:
  - `tags` objects - Allow custom extensions on tag definitions
  - `securitySchemes` objects - Support extensions in security scheme definitions
  - `components/schemas` - Enable extensions in schema definitions
  - `components/parameters` - Support extensions in parameter definitions
  - `components/responses` - Allow extensions in response definitions
  - `servers` objects - Support extensions in server configurations
- **Implementation Ideas**:
  - Extend validator to check different object contexts
  - Update completion provider to offer context-aware suggestions
  - Add configuration for context-specific extension rules

## Technical Improvements

### 3. Enhanced Configuration
- Support for complex validation rules (regex patterns, enum values)
- Allow different extension requirements per context
- Support for extension groups/profiles

### 4. Better Error Reporting
- More detailed error messages with fix suggestions
- Quick fixes for missing required extensions
- Bulk add missing extensions command

### 5. Testing
- Add unit tests for validator logic
- Integration tests for VS Code extension features
- Test coverage for different OpenAPI formats (YAML/JSON)