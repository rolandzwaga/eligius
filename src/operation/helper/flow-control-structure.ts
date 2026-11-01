import {
  breakForEachSystemName,
  continueForEachSystemName,
  endForEachSystemName,
  endWhenSystemName,
  forEachSystemName,
  otherwiseSystemName,
  whenSystemName,
} from '@operation/helper/flow-control-names.ts';

/**
 * A control-flow block that is not well formed, found by
 * {@link findFlowControlProblems}.
 */
export interface IFlowControlProblem {
  /** The index, in the operation list, of the operation the problem is reported at */
  index: number;
  /** What is wrong, naming the operations and their indices */
  message: string;
}

type TOpener = typeof whenSystemName | typeof forEachSystemName;

interface IOpenBlock {
  name: TOpener;
  index: number;
  hasOtherwise: boolean;
}

const closerOf: Record<TOpener, string> = {
  [whenSystemName]: endWhenSystemName,
  [forEachSystemName]: endForEachSystemName,
};

/**
 * Checks that the `when`/`otherwise`/`endWhen` and `forEach`/`endForEach`
 * blocks of an operation list are balanced and nested, and that
 * `breakForEach` and `continueForEach` sit inside a `forEach`.
 *
 * The interpreter does not check this. An `endWhen` that closes a `forEach`,
 * or an `endWhen` without a `when`, pops the wrong scope at runtime, and the
 * action then fails with a TypeError on the next operation, or runs with the
 * wrong scope. A block that is never closed runs to the end of the list.
 *
 * @param systemNames The system names of the operations, in order
 * @returns The problems in list order, empty when the blocks are well formed
 */
export function findFlowControlProblems(
  systemNames: readonly string[]
): IFlowControlProblem[] {
  const problems: IFlowControlProblem[] = [];
  const stack: IOpenBlock[] = [];

  const close = (closer: string, expected: TOpener, index: number) => {
    const top = stack[stack.length - 1];
    if (!top) {
      problems.push({
        index,
        message: `${closer} at index ${index} has no open ${expected} to close.`,
      });
      return;
    }
    if (top.name !== expected) {
      problems.push({
        index,
        message: `${closer} at index ${index} closes the ${top.name} at index ${top.index}, which must be closed with ${closerOf[top.name]} first: blocks must nest.`,
      });
    }
    stack.pop();
  };

  systemNames.forEach((name, index) => {
    switch (name) {
      case whenSystemName:
      case forEachSystemName:
        stack.push({name, index, hasOtherwise: false});
        break;
      case otherwiseSystemName: {
        const top = stack[stack.length - 1];
        if (!top || top.name !== whenSystemName) {
          problems.push({
            index,
            message: top
              ? `otherwise at index ${index} is inside the forEach at index ${top.index}, not directly inside a when.`
              : `otherwise at index ${index} has no open when.`,
          });
        } else if (top.hasOtherwise) {
          problems.push({
            index,
            message: `otherwise at index ${index} is the second otherwise of the when at index ${top.index}.`,
          });
        } else {
          top.hasOtherwise = true;
        }
        break;
      }
      case endWhenSystemName:
        close(endWhenSystemName, whenSystemName, index);
        break;
      case endForEachSystemName:
        close(endForEachSystemName, forEachSystemName, index);
        break;
      case breakForEachSystemName:
      case continueForEachSystemName:
        if (!stack.some(block => block.name === forEachSystemName)) {
          problems.push({
            index,
            message: `${name} at index ${index} is not inside a forEach.`,
          });
        }
        break;
      default:
        break;
    }
  });

  for (const open of stack) {
    problems.push({
      index: open.index,
      message: `${open.name} at index ${open.index} is never closed with ${closerOf[open.name]}.`,
    });
  }

  return problems.sort((a, b) => a.index - b.index);
}
