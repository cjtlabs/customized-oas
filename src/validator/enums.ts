export const ExtensionLocationEnum = {
  Root: 'root',
  Servers: 'servers',
  Tags: 'tags',
  Parameters: 'parameters',
  RequestBody: 'requestBody',
} as const;

export type ExtensionLocation = (typeof ExtensionLocationEnum)[keyof typeof ExtensionLocationEnum];
