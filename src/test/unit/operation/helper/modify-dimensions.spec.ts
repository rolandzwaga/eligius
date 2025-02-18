import { expect } from 'chai';
import { beforeEach, describe, test, type TestContext } from 'vitest';
import { modifyDimensions } from '../../../../operation/helper/modify-dimensions.ts';
import type { IDimensions } from '../../../../types.ts';

type ModifyDimensionsSuiteContext = { dimensions: IDimensions } & TestContext;
// ADDING
// SUBTRACTING
// DIVIDING
// MULTIPLYING
// RATIOS

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe<ModifyDimensionsSuiteContext>('modifyDimensions', () => {
  beforeEach((context) => {
    withContext<ModifyDimensionsSuiteContext>(context);

    context.dimensions = {
      width: 200,
      height: 300,
    };
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by adding 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100');

    // expect
    expect(modifiedDimension.width).to.be.equal(300);
    expect(modifiedDimension.height).to.be.equal(400);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by adding 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100h');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(400);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by adding 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100w');

    // expect
    expect(modifiedDimension.width).to.be.equal(300);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by adding 50%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50%');

    // expect
    expect(modifiedDimension.width).to.be.equal(300);
    expect(modifiedDimension.height).to.be.equal(450);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by adding 50%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50h%');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(450);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by adding 50%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50w%');

    // expect
    expect(modifiedDimension.width).to.be.equal(300);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by subtracting 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '-100');

    // expect
    expect(modifiedDimension.width).to.be.equal(100);
    expect(modifiedDimension.height).to.be.equal(200);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by dividing by 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(3);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by dividing by 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100h');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(3);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by dividing by 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100w');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by dividing by 50%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50%');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(2);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by dividing by 50%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50h%');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(2);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by dividing by 50%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50w%');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by multiplying by 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100');

    // expect
    expect(modifiedDimension.width).to.be.equal(20000);
    expect(modifiedDimension.height).to.be.equal(30000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by multiplying by 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100h');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(30000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by multiplying by 100', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100w');

    // expect
    expect(modifiedDimension.width).to.be.equal(20000);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width and height by multiplying by 100%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100%');

    // expect
    expect(modifiedDimension.width).to.be.equal(40000);
    expect(modifiedDimension.height).to.be.equal(90000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by multiplying by 100%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100w%');

    // expect
    expect(modifiedDimension.width).to.be.equal(40000);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by multiplying by 100%', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100h%');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(90000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by a ratio of 8-1 to the width', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+0|h[ar=8-1]');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(25);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by a ratio of 8-1 to the height', (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+0|w[ar=8-1]');

    // expect
    expect(modifiedDimension.width).to.be.equal(2400);
    expect(modifiedDimension.height).to.be.equal(300);
  });
  test<ModifyDimensionsSuiteContext>('should throw an error when the modifer has wrongly formatted ratio modifers', (context) => {
    // test
    const { dimensions } = context;

    expect(() => modifyDimensions(dimensions, '+0|w[ar=8-]')).throws(
      'Badly formatted modifier, expect two ratios: ar=8-'
    );
  });
});
