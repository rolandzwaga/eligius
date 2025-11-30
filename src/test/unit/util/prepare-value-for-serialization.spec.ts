import {LabelController} from '@controllers/index.ts';
import {prepareValueForSerialization} from '@util/prepare-value-for-serialization.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

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
    expect(result.a).toBe(1);
    expect(result.b).toBe('[jQuery object]');
    expect(result.c).toBe('(i) => i');
    expect(result.d).toEqual([1, 'a', '[jQuery object]', '(i) => i']);
    expect(result.e).toBeNull();
    expect(result.f).toBeUndefined();
    expect(result.g).toBe('function(i) {');
    expect(result.controllerInstance.startsWith('class LabelController')).to.be
      .true;
    expect(result.someObject.prop).toBe(true);
    expect(result.simpleClass).toBe('function SimpleClass() {');
  });
});
