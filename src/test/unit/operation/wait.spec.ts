import { expect } from 'chai';
import { suite } from 'uvu';
import { wait } from '../../../operation/wait.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const WaitSuite =
  suite<{ timeout: typeof window.setTimeout; mseconds: number }>('wait');

WaitSuite.before((context) => {
  context.mseconds = 0;
  context.timeout = window.setTimeout;
  global.setTimeout = function (func: Function, ms: number) {
    context.mseconds = ms;
    func();
  } as any;
});

WaitSuite.after((context) => {
  global.setTimeout = context.timeout;
});

WaitSuite(
  'should wait for the specified amount of milliseconds',
  async (context) => {
    // given
    const operationData = {
      milliseconds: 1000,
    };

    // test
    const data = await applyOperation<Promise<any>>(wait, operationData);

    // expect
    expect(data).to.equal(operationData);
    expect(context.mseconds).to.equal(operationData.milliseconds);
  }
);

WaitSuite.run();
