export type TComplexProperyMetadata = {
  type: TParameterTypes;
  defaultValue?: any;
  required?: boolean;
};

export type TArrayProperyMetadata = {
  type: 'ParameterType:array';
  itemType: TParameterTypes;
  required?: boolean;
};

export type TPropertyMetadata =
  | TComplexProperyMetadata
  | TArrayProperyMetadata
  | TParameterTypes;

export type TPropertiesMetadata<T> = { [P in keyof T]?: TPropertyMetadata };

export interface IOperationMetadata<T> {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: TPropertiesMetadata<T>;
  outputProperties?: TPropertiesMetadata<T>;
}

export type TParameterTypes =
  | 'ParameterType:htmlElementName'
  | 'ParameterType:className'
  | 'ParameterType:selector'
  | 'ParameterType:string'
  | 'ParameterType:integer'
  | 'ParameterType:object'
  | 'ParameterType:boolean'
  | 'ParameterType:array'
  | 'ParameterType:eventTopic'
  | 'ParameterType:eventName'
  | 'ParameterType:systemName'
  | 'ParameterType:actionName'
  | 'ParameterType:controllerName'
  | 'ParameterType:dimensions'
  | 'ParameterType:dimensionsModifier'
  | 'ParameterType:url'
  | 'ParameterType:htmlContent'
  | 'ParameterType:labelId'
  | 'ParameterType:ImagePath'
  | 'ParameterType:QuadrantPosition';
