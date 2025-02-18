import type { TPropertyMetadata } from '../../operation/metadata/types.ts';

export type IControllerMetadata<T> = {
  description: string;
  dependentProperties?: (keyof T)[];
  properties?: Partial<Record<keyof T, TPropertyMetadata>>;
};
