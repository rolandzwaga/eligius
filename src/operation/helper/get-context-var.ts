export type VariableName = `@${string}`;

export const getContextVar = (variables: Record<string, any>|undefined, identifier: VariableName) => {
  const name = identifier.substring(1);
  return variables ? variables[name] : undefined;
};


export const isVariableName = (value: string): value is VariableName => value.startsWith('@');