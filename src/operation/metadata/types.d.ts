import TParameterTypes from './ParameterTypes';

export type TComplexProperyMetadata = {
  type: TParameterTypes;
  required: boolean;
};

export type TArrayProperyMetadata = {
  type: 'ParameterType:array';
  itemType: Omit<TParameterTypes, 'ParameterType:array'>;
  required?: boolean;
};

export type TPropertyMetadata = TComplexProperyMetadata | TArrayProperyMetadata | TParameterTypes;

export interface IOperationMetadata<T> {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: Record<string, TPropertyMetadata>;
  outputProperties?: Record<string, TParameterTypes>;
}
