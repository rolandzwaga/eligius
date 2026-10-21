import {
  type InterfaceDeclaration,
  type JSDocParameterTag,
  Node,
  SyntaxKind,
} from 'ts-morph';
import {toStringLiteral} from './shared.ts';

/**
 * The metadata of one element of an event's `args` tuple.
 */
export interface IEventArgMetadata {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
}

/**
 * Reads the argument metadata from the `args` tuple of an event interface.
 *
 * - The name comes from the tuple label (`arg<index>` for an unlabeled element).
 * - `optional` is set for `label?: T` and for unlabeled `T?` elements.
 * - The description comes from the interface's `@param <label>` tag, without
 *   the leading `- `.
 *
 * @param interfaceDecl - The event interface, with a `name` and an `args` property
 * @returns One entry per tuple element, empty when `args` is not a tuple
 */
export function getEventArgMetadata(
  interfaceDecl: InterfaceDeclaration
): IEventArgMetadata[] {
  const typeNode = interfaceDecl.getProperty('args')?.getTypeNode();
  if (!typeNode || !Node.isTupleTypeNode(typeNode)) {
    return [];
  }
  const descriptions = getParamDescriptions(interfaceDecl);

  return typeNode.getElements().map((element, index) => {
    let name = `arg${index}`;
    let type: string;
    let optional = false;

    if (Node.isNamedTupleMember(element)) {
      name = element.getName();
      type = element.getTypeNode().getText();
      optional = element.hasQuestionToken();
    } else if (element.isKind(SyntaxKind.OptionalType)) {
      type = element.getTypeNode().getText();
      optional = true;
    } else {
      type = element.getText();
    }

    const metadata: IEventArgMetadata = {name, type};
    const description = descriptions.get(name);
    if (description) {
      metadata.description = description;
    }
    if (optional) {
      metadata.optional = true;
    }
    return metadata;
  });
}

function getParamDescriptions(
  interfaceDecl: InterfaceDeclaration
): Map<string, string> {
  const descriptions = new Map<string, string>();
  for (const tag of interfaceDecl.getJsDocs().flatMap(doc => doc.getTags())) {
    if (!Node.isJSDocParameterTag(tag)) {
      continue;
    }
    const description = getParamTagText(tag);
    if (description) {
      descriptions.set(tag.getName(), description);
    }
  }
  return descriptions;
}

function getParamTagText(tag: JSDocParameterTag): string {
  return (tag.getCommentText() ?? '')
    .trim()
    .replace(/^-\s*/, '')
    .replace(/\s+/g, ' ');
}

/**
 * Formats argument metadata as the source of an array literal for the
 * generated metadata files. Every string is an escaped literal, so a type or a
 * description containing quotes cannot break the generated code.
 *
 * @param args - The argument metadata
 * @param includeOptional - Whether to emit the `optional` flag. The generator
 * only emits it when `IEventMetadata` declares the field.
 * @returns The array elements, without the surrounding brackets
 */
export function formatEventArgMetadata(
  args: IEventArgMetadata[],
  includeOptional: boolean
): string {
  return args
    .map(arg => {
      const fields = [
        `name: ${toStringLiteral(arg.name)}`,
        `type: ${toStringLiteral(arg.type)}`,
      ];
      if (arg.description) {
        fields.push(`description: ${toStringLiteral(arg.description)}`);
      }
      if (includeOptional && arg.optional) {
        fields.push('optional: true');
      }
      return `\n      {\n        ${fields.join(',\n        ')}\n      }`;
    })
    .join(',');
}
