import { expect } from 'chai';
import { modifyDimensions } from '../operation/helper/modify-dimensions';

describe('modifyDimensions', () => {
  // given
  let dimensions;

  beforeEach(() => {
    dimensions = {
      width: 200,
      height: 300,
    };
  });

  // ADDING

  it('should modify the height and width by adding 100', () => {
    // test
    modifyDimensions(dimensions, '+100');

    // expect
    expect(dimensions.width).to.be.equal(300);
    expect(dimensions.height).to.be.equal(400);
  });

  it('should modify the height by adding 100', () => {
    // test
    modifyDimensions(dimensions, '+100h');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(400);
  });

  it('should modify the width by adding 100', () => {
    // test
    modifyDimensions(dimensions, '+100w');

    // expect
    expect(dimensions.width).to.be.equal(300);
    expect(dimensions.height).to.be.equal(300);
  });

  it('should modify the height and width by adding 50%', () => {
    // test
    modifyDimensions(dimensions, '+50%');

    // expect
    expect(dimensions.width).to.be.equal(300);
    expect(dimensions.height).to.be.equal(450);
  });

  it('should modify the height by adding 50%', () => {
    // test
    modifyDimensions(dimensions, '+50h%');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(450);
  });

  it('should modify the width by adding 50%', () => {
    // test
    modifyDimensions(dimensions, '+50w%');

    // expect
    expect(dimensions.width).to.be.equal(300);
    expect(dimensions.height).to.be.equal(300);
  });

  // SUBTRACTING

  it('should modify the height and width by subtracting 100', () => {
    // test
    modifyDimensions(dimensions, '-100');

    // expect
    expect(dimensions.width).to.be.equal(100);
    expect(dimensions.height).to.be.equal(200);
  });

  // DIVIDING

  it('should modify the height and width by dividing by 100', () => {
    // test
    modifyDimensions(dimensions, '/100');

    // expect
    expect(dimensions.width).to.be.equal(2);
    expect(dimensions.height).to.be.equal(3);
  });

  it('should modify the height by dividing by 100', () => {
    // test
    modifyDimensions(dimensions, '/100h');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(3);
  });

  it('should modify the width by dividing by 100', () => {
    // test
    modifyDimensions(dimensions, '/100w');

    // expect
    expect(dimensions.width).to.be.equal(2);
    expect(dimensions.height).to.be.equal(300);
  });

  it('should modify the height and width by dividing by 50%', () => {
    // test
    modifyDimensions(dimensions, '/50%');

    // expect
    expect(dimensions.width).to.be.equal(2);
    expect(dimensions.height).to.be.equal(2);
  });

  it('should modify the height by dividing by 50%', () => {
    // test
    modifyDimensions(dimensions, '/50h%');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(2);
  });

  it('should modify the width by dividing by 50%', () => {
    // test
    modifyDimensions(dimensions, '/50w%');

    // expect
    expect(dimensions.width).to.be.equal(2);
    expect(dimensions.height).to.be.equal(300);
  });

  // MULTIPLYING

  it('should modify the height and width by multiplying by 100', () => {
    // test
    modifyDimensions(dimensions, '*100');

    // expect
    expect(dimensions.width).to.be.equal(20000);
    expect(dimensions.height).to.be.equal(30000);
  });

  it('should modify the height by multiplying by 100', () => {
    // test
    modifyDimensions(dimensions, '*100h');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(30000);
  });

  it('should modify the width by multiplying by 100', () => {
    // test
    modifyDimensions(dimensions, '*100w');

    // expect
    expect(dimensions.width).to.be.equal(20000);
    expect(dimensions.height).to.be.equal(300);
  });

  it('should modify the width and height by multiplying by 100%', () => {
    // test
    modifyDimensions(dimensions, '*100%');

    // expect
    expect(dimensions.width).to.be.equal(40000);
    expect(dimensions.height).to.be.equal(90000);
  });

  it('should modify the width by multiplying by 100%', () => {
    // test
    modifyDimensions(dimensions, '*100w%');

    // expect
    expect(dimensions.width).to.be.equal(40000);
    expect(dimensions.height).to.be.equal(300);
  });

  it('should modify the height by multiplying by 100%', () => {
    // test
    modifyDimensions(dimensions, '*100h%');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(90000);
  });

  // RATIOS

  it('should modify the height by a ratio of 8-1 to the width', () => {
    // test
    modifyDimensions(dimensions, '+0|h[ar=8-1]');

    // expect
    expect(dimensions.width).to.be.equal(200);
    expect(dimensions.height).to.be.equal(25);
  });

  it('should modify the width by a ratio of 8-1 to the height', () => {
    // test
    modifyDimensions(dimensions, '+0|w[ar=8-1]');

    // expect
    expect(dimensions.width).to.be.equal(2400);
    expect(dimensions.height).to.be.equal(300);
  });
});
