import TParameterTypes from './TParameterTypes';

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

export type TPropertyMetadata = TComplexProperyMetadata | TArrayProperyMetadata | TParameterTypes;

export interface IOperationMetadata<T> {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: Record<string, TPropertyMetadata>;
  outputProperties?: Record<string, TParameterTypes>;
}
