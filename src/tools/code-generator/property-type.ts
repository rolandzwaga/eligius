import type {Node, PropertySignature, Type} from 'ts-morph';

/**
 * Returns the `type: ...` metadata entry for the given property, based on its TypeScript type.
 *
 * Optional properties (`key?: string`) are typed `string | undefined` under strictNullChecks,
 * so `undefined` and `null` are stripped from a union before the type is inspected.
 *
 * - A union of only `true | false` maps to `ParameterType:boolean`.
 * - A union of only literals maps to a list of values.
 * - Any other union maps to a `|` delimited list of parameter types, e.g.
 *   `ParameterType:string|ParameterType:number`.
 * - Any other type maps to `ParameterType:<type>`.
 *
 * Shared by the operation and controller metadata generators.
 *
 * @param property
 * @returns
 */
export const getTypeFromProperty = (property: PropertySignature): string => {
  const type = stripNullish(property.getType());

  if (type.isTypeParameter()) {
    const found = property
      .getParent()
      .getType()
      .getTypeArguments()
      .find(a => a.getText() === type.getSymbol()?.getName());
    if (!found) {
      throw new Error(
        `Can't resolve type parameter ${type.getSymbol()?.getName()} of property ${property.getName()}`
      );
    }
    const constraint = found.getConstraint();
    if (!constraint) {
      throw new Error(
        `No constriant on type parameter ${type.getSymbol()?.getName()} of property ${property.getName()}`
      );
    }
    return toTypeEntry(stripNullish(constraint), property);
  }

  return toTypeEntry(type, property);
};

const stripNullish = (type: Type): Type =>
  type.isUnion() ? type.getNonNullableType() : type;

const toTypeEntry = (type: Type, enclosingNode: Node): string => {
  if (type.isUnion()) {
    const members = type.getUnionTypes();
    if (members.every(u => u.isBooleanLiteral())) {
      return `type: 'ParameterType:boolean'`;
    }
    if (members.every(u => u.isLiteral() || u.isBooleanLiteral())) {
      const unionValues = members.map(u => u.getLiteralValue() ?? u.getText());
      return `type: [\n${unionValues
        .map(x => x.toString().replaceAll(/['`]/g, '\\$&'))
        .map(val => `{value: '${val}'}`)
        .join(',\n')}\n]`;
    }
    const parameterTypes = [
      ...new Set(
        members.map(
          member =>
            `ParameterType:${toParameterType(member, enclosingNode).name}`
        )
      ),
    ];
    return `type: '${parameterTypes.join('|')}'`;
  }

  const {name, itemType} = toParameterType(type, enclosingNode);
  if (itemType) {
    return `type: 'ParameterType:${name}',\nitemType: 'ParameterType:${itemType}'`;
  }
  return `type: 'ParameterType:${name}'`;
};

const toParameterType = (
  type: Type,
  enclosingNode: Node
): {name: string; itemType?: string} => {
  if (type.isBooleanLiteral() || type.isBoolean()) {
    return {name: 'boolean'};
  }
  if (type.isStringLiteral()) {
    return {name: 'string'};
  }
  if (type.isNumberLiteral()) {
    return {name: 'number'};
  }

  const aliasSymbol = type.getAliasSymbol();
  const propType = aliasSymbol
    ? aliasSymbol.getName()
    : type.getText(enclosingNode);

  if (
    propType.startsWith('Record') ||
    propType === 'unknown' ||
    propType === 'any'
  ) {
    return {name: 'object'};
  }
  if (propType.endsWith('[]')) {
    const itemType = propType.slice(0, -2);
    if (itemType === 'unknown' || itemType === 'any') {
      return {name: 'array'};
    }
    return {name: 'array', itemType};
  }
  if (propType.startsWith('(')) {
    return {name: 'function'};
  }
  return {name: propType};
};
