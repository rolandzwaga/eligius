import { expect } from 'chai';
import $ from 'jquery';
import { suite } from 'uvu';
import { LabelController } from '../../../controllers';
import { prepareValueForSerialization } from '../../../util/prepare-value-for-serialization';

const PrepareValueForSerializationSuite = suite('prepareValueForSerialization');

function SimpleClass(this: any) {
  this.i = 0;
  return this;
}

PrepareValueForSerializationSuite('should seriaize the given object', () => {
  // given

  const object = {
    a: 1,
    b: $('body'),
    c: function (i: number) {
      return i;
    },
    d: [1, 'a', $('body'), (i: number) => i],
    e: null,
    f: undefined,
    controllerInstance: new LabelController(),
    someObject: { prop: true },
    simpleClass: new (SimpleClass as any)(),
  };

  // test
  const result = prepareValueForSerialization(object);

  // expect
  expect(result.a).to.equal(1);
  expect(result.b).to.equal('jQuery object');
  expect(result.c).to.equal('function (i) {');
  expect(result.d).to.eql([1, 'a', 'jQuery object', '(i) => i']);
  expect(result.e).to.be.null;
  expect(result.f).to.be.undefined;
  expect(result.controllerInstance).to.equal('class LabelController {');
  expect(result.someObject.prop).to.be.true;
  expect(result.simpleClass).to.equal('function SimpleClass() {');
});

PrepareValueForSerializationSuite.run();
