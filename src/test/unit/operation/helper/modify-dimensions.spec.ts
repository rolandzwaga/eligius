import { expect } from 'chai';
import { suite } from 'uvu';
import { modifyDimensions } from '../../../../operation/helper/modify-dimensions';
import { IDimensions } from '../../../../types';

const ModifyDimensionsSuite =
  suite<{ dimensions: IDimensions }>('modifyDimensions');

ModifyDimensionsSuite.before.each((context) => {
  context.dimensions = {
    width: 200,
    height: 300,
  };
});

// ADDING

ModifyDimensionsSuite(
  'should modify the height and width by adding 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+100');

    // expect
    expect(modifiedDimension.width).to.be.equal(300);
    expect(modifiedDimension.height).to.be.equal(400);
  }
);

ModifyDimensionsSuite('should modify the height by adding 100', (context) => {
  // test
  const { dimensions } = context;
  const modifiedDimension = modifyDimensions(dimensions, '+100h');

  // expect
  expect(modifiedDimension.width).to.be.equal(200);
  expect(modifiedDimension.height).to.be.equal(400);
});

ModifyDimensionsSuite('should modify the width by adding 100', (context) => {
  // test
  const { dimensions } = context;
  const modifiedDimension = modifyDimensions(dimensions, '+100w');

  // expect
  expect(modifiedDimension.width).to.be.equal(300);
  expect(modifiedDimension.height).to.be.equal(300);
});

ModifyDimensionsSuite(
  'should modify the height and width by adding 50%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+50%');

    // expect
    expect(modifiedDimension.width).to.be.equal(300);
    expect(modifiedDimension.height).to.be.equal(450);
  }
);

ModifyDimensionsSuite('should modify the height by adding 50%', (context) => {
  // test
  const { dimensions } = context;
  const modifiedDimension = modifyDimensions(dimensions, '+50h%');

  // expect
  expect(modifiedDimension.width).to.be.equal(200);
  expect(modifiedDimension.height).to.be.equal(450);
});

ModifyDimensionsSuite('should modify the width by adding 50%', (context) => {
  // test
  const { dimensions } = context;
  const modifiedDimension = modifyDimensions(dimensions, '+50w%');

  // expect
  expect(modifiedDimension.width).to.be.equal(300);
  expect(modifiedDimension.height).to.be.equal(300);
});

// SUBTRACTING

ModifyDimensionsSuite(
  'should modify the height and width by subtracting 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '-100');

    // expect
    expect(modifiedDimension.width).to.be.equal(100);
    expect(modifiedDimension.height).to.be.equal(200);
  }
);

// DIVIDING

ModifyDimensionsSuite(
  'should modify the height and width by dividing by 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(3);
  }
);

ModifyDimensionsSuite(
  'should modify the height by dividing by 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100h');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(3);
  }
);

ModifyDimensionsSuite(
  'should modify the width by dividing by 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/100w');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(300);
  }
);

ModifyDimensionsSuite(
  'should modify the height and width by dividing by 50%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50%');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(2);
  }
);

ModifyDimensionsSuite(
  'should modify the height by dividing by 50%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50h%');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(2);
  }
);

ModifyDimensionsSuite(
  'should modify the width by dividing by 50%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '/50w%');

    // expect
    expect(modifiedDimension.width).to.be.equal(2);
    expect(modifiedDimension.height).to.be.equal(300);
  }
);

// MULTIPLYING

ModifyDimensionsSuite(
  'should modify the height and width by multiplying by 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100');

    // expect
    expect(modifiedDimension.width).to.be.equal(20000);
    expect(modifiedDimension.height).to.be.equal(30000);
  }
);

ModifyDimensionsSuite(
  'should modify the height by multiplying by 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100h');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(30000);
  }
);

ModifyDimensionsSuite(
  'should modify the width by multiplying by 100',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100w');

    // expect
    expect(modifiedDimension.width).to.be.equal(20000);
    expect(modifiedDimension.height).to.be.equal(300);
  }
);

ModifyDimensionsSuite(
  'should modify the width and height by multiplying by 100%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100%');

    // expect
    expect(modifiedDimension.width).to.be.equal(40000);
    expect(modifiedDimension.height).to.be.equal(90000);
  }
);

ModifyDimensionsSuite(
  'should modify the width by multiplying by 100%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100w%');

    // expect
    expect(modifiedDimension.width).to.be.equal(40000);
    expect(modifiedDimension.height).to.be.equal(300);
  }
);

ModifyDimensionsSuite(
  'should modify the height by multiplying by 100%',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '*100h%');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(90000);
  }
);

// RATIOS

ModifyDimensionsSuite(
  'should modify the height by a ratio of 8-1 to the width',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+0|h[ar=8-1]');

    // expect
    expect(modifiedDimension.width).to.be.equal(200);
    expect(modifiedDimension.height).to.be.equal(25);
  }
);

ModifyDimensionsSuite(
  'should modify the width by a ratio of 8-1 to the height',
  (context) => {
    // test
    const { dimensions } = context;
    const modifiedDimension = modifyDimensions(dimensions, '+0|w[ar=8-1]');

    // expect
    expect(modifiedDimension.width).to.be.equal(2400);
    expect(modifiedDimension.height).to.be.equal(300);
  }
);

ModifyDimensionsSuite(
  'should throw an error when the modifer has wrongly formatted ratio modifers',
  (context) => {
    // test
    const { dimensions } = context;

    expect(() => modifyDimensions(dimensions, '+0|w[ar=8-]')).throws(
      'Badly formatted modifier, expect two ratios: ar=8-'
    );
  }
);

ModifyDimensionsSuite.run();
