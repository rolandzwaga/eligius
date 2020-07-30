import ParameterTypes from './ParameterTypes';

export type TComplexProperyMetadata = {
  type: string;
  required: boolean;
};

export type TPropertyMetadata = TComplexProperyMetadata | TParameterTypeNames;

export interface IOperationMetadata<T> {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: Record<string, TPropertyMetadata>;
  outputProperties?: Record<string, TParameterTypeNames>;
}
