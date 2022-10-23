import { expect } from 'chai';
import { suite } from 'uvu';
import { IMathOperationData, math } from '../../../operation/math';
import { applyOperation } from '../../../util/apply-operation';

const MathSuite = suite('math');

MathSuite('should perform all the math calculations', () => {
  // given

  const funcNames: (keyof Math)[] = Object.getOwnPropertyNames(Math).filter(
    (x) => Math[x as keyof Math] === 'functions'
  ) as (keyof Math)[];

  funcNames.forEach((functionName) => {
    const argCount = (Math[functionName] as any).length;
    const args = new Array(argCount).fill(0).map((x) => Math.random());
    const operationData: IMathOperationData = {
      args,
      functionName,
    };
    const result = applyOperation<typeof operationData>(math, operationData);

    expect(isNaN((result as any).mathResult)).to.equal(false);
  });
});

MathSuite.run();
