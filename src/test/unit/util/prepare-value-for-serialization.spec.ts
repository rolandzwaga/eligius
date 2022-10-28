import { expect } from 'chai';
import $ from 'jquery';
import { suite } from 'uvu';
import { prepareValueForSerialization } from '../../../util/prepare-value-for-serialization';

const PrepareValueForSerializationSuite = suite('prepareValueForSerialization');

PrepareValueForSerializationSuite('should seriaize the given object', () => {
  // given
  const object = {
    a: 1,
    b: $('body'),
    c: function (i: number) {
      return i;
    },
    d: [1, 'a', $('body'), (i: number) => i],
  };

  // test
  const result = prepareValueForSerialization(object);

  // expect
  expect(result.a).to.equal(1);
  expect(result.b).to.equal('jQuery object');
  expect(result.c).to.equal('function (i) {');
  expect(result.d).to.eql([1, 'a', 'jQuery object', '(i) => i']);
});

PrepareValueForSerializationSuite.run();
