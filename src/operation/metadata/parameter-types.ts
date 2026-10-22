/**
 * Every parameter type the operation and controller metadata may use. The
 * metadata generator fails on a type name that is not in this list.
 *
 * `RegExp` and the DOM node types (`Element`, `Text`, `Comment`, `Document`,
 * `DocumentFragment`) are the names the generator emits for `string | RegExp`
 * and `string | JQuery.Node` properties.
 *
 * Kept out of `types.ts`: the generated metadata index re-exports `types.ts`
 * into the `metadata` namespace, whose consumers expect only metadata
 * functions there.
 */
export const PARAMETER_TYPES = [
  'ParameterType:htmlElementName',
  'ParameterType:className',
  'ParameterType:selector',
  'ParameterType:string',
  'ParameterType:number',
  'ParameterType:object',
  'ParameterType:boolean',
  'ParameterType:array',
  'ParameterType:eventTopic',
  'ParameterType:eventName',
  'ParameterType:systemName',
  'ParameterType:actionName',
  'ParameterType:controllerName',
  'ParameterType:dimensions',
  'ParameterType:dimensionsModifier',
  'ParameterType:url',
  'ParameterType:htmlContent',
  'ParameterType:labelId',
  'ParameterType:ImagePath',
  'ParameterType:QuadrantPosition',
  'ParameterType:jQuery',
  'ParameterType:expression',
  'ParameterType:mathfunction',
  'ParameterType:cssProperties',
  'ParameterType:function',
  'ParameterType:Date',
  'ParameterType:languagecode',
  'ParameterType:RegExp',
  'ParameterType:Element',
  'ParameterType:Text',
  'ParameterType:Comment',
  'ParameterType:Document',
  'ParameterType:DocumentFragment',
] as const;
