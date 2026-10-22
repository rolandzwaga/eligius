import camelCaseToDash from '@util/camel-case-to-dash.ts';

interface ICommentPart {
  kind: string;
  text: string;
}

interface IReflectionComment {
  summary?: ICommentPart[];
}

/**
 * The subset of a TypeDoc JSON reflection that the README generator uses.
 */
export interface IReadMeItemInfo {
  name: string;
  comment?: IReflectionComment;
  signatures?: {name: string; comment?: IReflectionComment}[];
}

/**
 * Returns the first paragraph of the reflection's summary as a markdown link title
 * (` "text"`), or an empty string when there is no summary.
 *
 * Functions and classes carry their comment on a signature, variables (operations)
 * carry it on the reflection itself.
 *
 * @param itemInfo
 * @returns
 */
export function getFirstCommentLine(itemInfo: IReadMeItemInfo): string {
  const signature = itemInfo.signatures?.find(x => x.name === itemInfo.name);
  const summary = (signature?.comment ?? itemInfo.comment)?.summary;
  if (!summary?.length) {
    return '';
  }

  const firstParagraph = summary
    .map(part => part.text)
    .join('')
    .split(/\r?\n\s*\r?\n/)[0]
    .replace(/\r?\n/g, ' ')
    .replaceAll('"', '\\"')
    .trim();

  return firstParagraph ? ` "${firstParagraph}"` : '';
}

/**
 * Generates the README list entry for the given reflection. Operations get a link to
 * their JSON schema, but only when `hasSchema` confirms that the schema exists.
 *
 * @param linkSuffix 'variables' for operations, 'classes' for controllers
 * @param itemInfo
 * @param hasSchema
 * @returns
 */
export function generateLink(
  linkSuffix: string,
  itemInfo: IReadMeItemInfo,
  hasSchema: (schemaFileName: string) => boolean = () => false
): string {
  const link = `- [${itemInfo.name}](https://rolandzwaga.github.io/eligius/${linkSuffix}/${itemInfo.name}.html${getFirstCommentLine(itemInfo)})`;

  if (linkSuffix !== 'variables') {
    return link;
  }

  const schemaFileName = `${camelCaseToDash(itemInfo.name)}.json`;
  if (!hasSchema(schemaFileName)) {
    return link;
  }
  return `${link} - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/${schemaFileName}))`;
}
