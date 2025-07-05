/**
 * 
 * Merges the properties of the target object into the source object, only the properties that do not exist yet on the source.
 * 
 * This function is pure, so it returns  a new instance that reflects the merging of the two objects.
 * 
 * The merge is shallow.
 * 
 * @param target 
 * @param source 
 * @returns 
 */
export const mergeIfMissing = <Src extends Record<PropertyKey, any>, Trg extends Partial<Src> & Record<PropertyKey, any>>(target: Src, source: Trg): Src & Trg =>
    Object.entries(source).reduce(
      (acc, [key, value]) => (key in acc ? acc : { ...acc, [key]: value }),
      target
    );