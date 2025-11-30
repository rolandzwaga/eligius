import {modifyDimensions} from '@operation/helper/modify-dimensions.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';
import type {IDimensions} from '../../../../types.ts';

type ModifyDimensionsSuiteContext = {dimensions: IDimensions} & TestContext;
// ADDING
// SUBTRACTING
// DIVIDING
// MULTIPLYING
// RATIOS

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<ModifyDimensionsSuiteContext>('modifyDimensions', () => {
  beforeEach(context => {
    withContext<ModifyDimensionsSuiteContext>(context);

    context.dimensions = {
      width: 200,
      height: 300,
    };
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by adding 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100');

    // expect
    expect(modifiedDimension.width).toBe(300);
    expect(modifiedDimension.height).toBe(400);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by adding 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100h');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(400);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by adding 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100w');

    // expect
    expect(modifiedDimension.width).toBe(300);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by adding 50%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50%');

    // expect
    expect(modifiedDimension.width).toBe(300);
    expect(modifiedDimension.height).toBe(450);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by adding 50%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50h%');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(450);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by adding 50%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50w%');

    // expect
    expect(modifiedDimension.width).toBe(300);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by subtracting 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '-100');

    // expect
    expect(modifiedDimension.width).toBe(100);
    expect(modifiedDimension.height).toBe(200);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by dividing by 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100');

    // expect
    expect(modifiedDimension.width).toBe(2);
    expect(modifiedDimension.height).toBe(3);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by dividing by 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100h');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(3);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by dividing by 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100w');

    // expect
    expect(modifiedDimension.width).toBe(2);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by dividing by 50%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50%');

    // expect
    expect(modifiedDimension.width).toBe(2);
    expect(modifiedDimension.height).toBe(2);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by dividing by 50%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50h%');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(2);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by dividing by 50%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50w%');

    // expect
    expect(modifiedDimension.width).toBe(2);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height and width by multiplying by 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100');

    // expect
    expect(modifiedDimension.width).toBe(20000);
    expect(modifiedDimension.height).toBe(30000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by multiplying by 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100h');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(30000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by multiplying by 100', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100w');

    // expect
    expect(modifiedDimension.width).toBe(20000);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width and height by multiplying by 100%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100%');

    // expect
    expect(modifiedDimension.width).toBe(40000);
    expect(modifiedDimension.height).toBe(90000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by multiplying by 100%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100w%');

    // expect
    expect(modifiedDimension.width).toBe(40000);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by multiplying by 100%', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100h%');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(90000);
  });
  test<ModifyDimensionsSuiteContext>('should modify the height by a ratio of 8-1 to the width', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+0|h[ar=8-1]');

    // expect
    expect(modifiedDimension.width).toBe(200);
    expect(modifiedDimension.height).toBe(25);
  });
  test<ModifyDimensionsSuiteContext>('should modify the width by a ratio of 8-1 to the height', context => {
    // test
    const {dimensions} = context;
    const modifiedDimension = modifyDimensions(dimensions, '+0|w[ar=8-1]');

    // expect
    expect(modifiedDimension.width).toBe(2400);
    expect(modifiedDimension.height).toBe(300);
  });
  test<ModifyDimensionsSuiteContext>('should throw an error when the modifer has wrongly formatted ratio modifers', context => {
    // test
    const {dimensions} = context;

    expect(() => modifyDimensions(dimensions, '+0|w[ar=8-]')).toThrow(
      'Badly formatted modifier, expect two ratios: ar=8-'
    );
  });
});
