import { TPropertyMetadata } from '../../operation/metadata/types';

export type IControllerMetadata<T> = {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: Partial<Record<keyof T, TPropertyMetadata>>;
};
