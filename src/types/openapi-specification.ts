type Contact = {
  name?: string;
  url?: string;
  email: string;
};

type License = {
  name: string;
  url?: string;
  identifier?: string;
};

type Info = {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  summary?: string;
};

type ServerVariable = {
  default: string;
  description?: string;
  enum?: string[];
};

type Server = {
  url: string;
  description?: string;
  variables?: { [key: string]: ServerVariable };
};

type ExternalDocumentation = {
  description?: string;
  url: string;
};

type Tag = {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  // for custom extensions
  [key: string]: any;
};

// Parameter types
type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

type ParameterStyle =
  | 'matrix'
  | 'label'
  | 'form'
  | 'simple'
  | 'spaceDelimited'
  | 'pipeDelimited'
  | 'deepObject';

type SchemaObject = {
  // JSON Schema properties
  type?: 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number | boolean;
  minimum?: number;
  exclusiveMinimum?: number | boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
  const?: any;

  // Schema composition
  allOf?: (SchemaObject | Reference)[];
  oneOf?: (SchemaObject | Reference)[];
  anyOf?: (SchemaObject | Reference)[];
  not?: SchemaObject | Reference;

  // Object properties
  properties?: { [key: string]: SchemaObject | Reference };
  additionalProperties?: boolean | SchemaObject | Reference;
  patternProperties?: { [key: string]: SchemaObject | Reference };

  // Array properties
  items?: SchemaObject | Reference;
  prefixItems?: (SchemaObject | Reference)[];
  contains?: SchemaObject | Reference;

  // OpenAPI specific
  discriminator?: Discriminator;
  xml?: XML;
  externalDocs?: ExternalDocumentation;
  example?: any;
  examples?: { [key: string]: any };
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;

  // JSON Schema 2020-12
  $schema?: string;
  $vocabulary?: { [key: string]: boolean };
  $id?: string;
  $anchor?: string;
  $ref?: string;
  $defs?: { [key: string]: SchemaObject };
  $comment?: string;
  // for custom extensions
  [key: string]: any;
};

type Discriminator = {
  propertyName: string;
  mapping?: { [key: string]: string };
};

type XML = {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
};

type Reference = {
  $ref: string;
  summary?: string;
  description?: string;
};

export type Parameter = {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: SchemaObject | Reference;
  example?: any;
  examples?: { [key: string]: Example | Reference };
  content?: { [mediaType: string]: MediaType };
  // for custom extensions
  [key: string]: any;
};

type Example = {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
};

type MediaType = {
  schema?: SchemaObject | Reference;
  example?: any;
  examples?: { [key: string]: Example | Reference };
  encoding?: { [key: string]: Encoding };
};

type Encoding = {
  contentType?: string;
  headers?: { [key: string]: Header | Reference };
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
};

type Header = Omit<Parameter, 'name' | 'in'>;

export type RequestBody = {
  description?: string;
  content: { [mediaType: string]: MediaType };
  required?: boolean;
};

type Response = {
  description: string;
  headers?: { [key: string]: Header | Reference };
  content?: { [mediaType: string]: MediaType };
  links?: { [key: string]: Link | Reference };
};

type Link = {
  operationRef?: string;
  operationId?: string;
  parameters?: { [key: string]: any };
  requestBody?: any;
  description?: string;
  server?: Server;
};

export type Responses = {
  [statusCode: string]: Response | Reference;
};

type Callback = {
  [expression: string]: PathItem | Reference;
};

type SecurityRequirement = {
  [securityScheme: string]: string[];
};

type Operation = {
  tags: string[];
  summary: string;
  description: string;
  externalDocs?: ExternalDocumentation;
  operationId: string;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: Responses;
  callbacks?: { [key: string]: Callback | Reference };
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
};

type PathItem = {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
};

type Paths = {
  [path: string]: PathItem | Reference;
};

type SecuritySchemeType = 'apiKey' | 'http' | 'mutualTLS' | 'oauth2' | 'openIdConnect';

type SecurityScheme = {
  type: SecuritySchemeType;
  description?: string;
  // For apiKey
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  // For http
  scheme?: string;
  bearerFormat?: string;
  // For oauth2
  flows?: OAuthFlows;
  // For openIdConnect
  openIdConnectUrl?: string;
  // for custom extensions
  [key: string]: any;
};

type OAuthFlows = {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
};

type OAuthFlow = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [scope: string]: string };
  // for custom extensions
  [key: string]: any;
};

type Components = {
  securitySchemes: { [key: string]: SecurityScheme | Reference };
  schemas?: { [key: string]: SchemaObject | Reference };
  responses?: { [key: string]: Response | Reference };
  parameters?: { [key: string]: Parameter | Reference };
  examples?: { [key: string]: Example | Reference };
  requestBodies?: { [key: string]: RequestBody | Reference };
  headers?: { [key: string]: Header | Reference };
  links?: { [key: string]: Link | Reference };
  callbacks?: { [key: string]: Callback | Reference };
  pathItems?: { [key: string]: PathItem | Reference };
};

type Webhook = {
  [name: string]: PathItem | Reference;
};

export type OpenAPIDocument = {
  openapi: string;
  info: Info;
  servers: Server[];
  tags: Tag[];
  components: Components;
  paths?: Paths;
  webhooks?: Webhook;
  security?: SecurityRequirement[];
  externalDocs?: ExternalDocumentation;
  [key: string]: any; // For specification extensions (x-*)
};
