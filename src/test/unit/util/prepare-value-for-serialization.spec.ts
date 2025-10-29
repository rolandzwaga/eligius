import {expect} from 'chai';
import $ from 'jquery';
import {describe, test} from 'vitest';
import {LabelController} from '../../../controllers/index.ts';
import {prepareValueForSerialization} from '../../../util/prepare-value-for-serialization.ts';

function SimpleClass(this: any) {
  this.i = 0;
  return this;
}

describe('prepareValueForSerialization', () => {
  test('should serialize the given object', () => {
    // given

    const object = {
      a: 1,
      b: $('body'),
      c: (i: number) => i,
      d: [1, 'a', $('body'), (i: number) => i],
      e: null,
      f: undefined,
      g: function (i: number) {
        return i;
      },
      controllerInstance: new LabelController(),
      someObject: {prop: true},
      simpleClass: new (SimpleClass as any)(),
    };

    // test
    const result = prepareValueForSerialization(object);

    // expect
    expect(result.a).to.equal(1);
    expect(result.b).to.equal('[jQuery object]');
    expect(result.c).to.equal('(i) => i');
    expect(result.d).to.eql([1, 'a', '[jQuery object]', '(i) => i']);
    expect(result.e).to.be.null;
    expect(result.f).to.be.undefined;
    expect(result.g).to.equal('function(i) {');
    expect(result.controllerInstance.startsWith('class LabelController')).to.be.true;
    expect(result.someObject.prop).to.be.true;
    expect(result.simpleClass).to.equal('function SimpleClass() {');
  });
});
