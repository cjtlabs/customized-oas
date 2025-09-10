import { ExtensionLocation } from '../validator/enums';

// Base fields shared by all custom extension property types
type BaseProperty = {
  description?: string;
  required?: boolean | string[];
};

// String, Number, Boolean (scalars)
type StringProperty = BaseProperty & { type: 'string' };
type NumberProperty = BaseProperty & { type: 'number' };
type BooleanProperty = BaseProperty & { type: 'boolean' };

// Object → only objects can have properties
type ObjectProperty = BaseProperty & {
  type: 'object';
  properties?: CustomExtensionProperty;
};

// Array → only arrays can have items
type ArrayProperty = BaseProperty & {
  type: 'array';
  items?: CustomExtension[];
};

// Union of property types
type CustomExtensionProperty =
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | ObjectProperty
  | ArrayProperty;

// Base property 'in' to attach custom extension in OAS Sections
export type CustomExtension = {
  in: ExtensionLocation;
  name: string;
} & CustomExtensionProperty;
