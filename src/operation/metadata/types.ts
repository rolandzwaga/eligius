export type THasRequired = {
  required?: boolean;
};

export type THasErased = {
  erased?: boolean;
};

export type THasDescription = {
  description?: string;
};

export type TComplexPropertyMetadata = {
  type: TConstantParametersTypes[] | TParameterTypes | TParameterTypesDelimited;
  defaultValue?: unknown;
} & THasRequired &
  THasErased &
  THasDescription;

export type TArrayProperyMetadata = {
  type: 'ParameterType:array';
  itemType: TParameterTypes;
} & THasRequired &
  THasErased &
  THasDescription;

export type TConstantParametersTypes = {
  value: string;
  default?: boolean;
} & THasDescription;

export type TPropertyMetadata =
  | TComplexPropertyMetadata
  | TArrayProperyMetadata
  | TParameterTypes;

export type TPropertiesMetadata<T> = {[P in keyof T]?: TPropertyMetadata};

export interface IOperationMetadata<T> {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: TPropertiesMetadata<T>;
  outputProperties?: TPropertiesMetadata<T>;
}

export type TParameterTypesDelimited =
  | `${TParameterTypes}`
  | `${TParameterTypes}|${string}`;

export type TParameterTypes =
  | 'ParameterType:htmlElementName'
  | 'ParameterType:className'
  | 'ParameterType:selector'
  | 'ParameterType:string'
  | 'ParameterType:number'
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
  | 'ParameterType:QuadrantPosition'
  | 'ParameterType:jQuery'
  | 'ParameterType:expression'
  | 'ParameterType:mathfunction'
  | 'ParameterType:cssProperties';
