import {Eventbus} from '@eventbus/eventbus.ts';
import {RequestVideoUriInterceptor} from '@eventbus/request-video-uri-interceptor.ts';
import {describe, expect, test, vi} from 'vitest';

describe('RequestVideoUriInterceptor', () => {
  test('given the interceptor registered for request-timeline-uri, when request-timeline-uri is broadcast with a uri and position, then before-request-timeline-uri receives the same arguments first', () => {
    // given
    const eventbus = new Eventbus();
    eventbus.registerInterceptor(
      'request-timeline-uri',
      new RequestVideoUriInterceptor(eventbus)
    );
    const calls: string[] = [];
    const before = vi.fn((uri: string, position?: number) => {
      calls.push(`before:${uri}:${position}`);
    });
    const request = vi.fn((uri: string, position?: number) => {
      calls.push(`request:${uri}:${position}`);
    });
    eventbus.on('before-request-timeline-uri', before);
    eventbus.on('request-timeline-uri', request);

    // test
    eventbus.broadcast('request-timeline-uri', ['timeline-2', 4.5]);

    // expect
    expect(before).toHaveBeenCalledWith('timeline-2', 4.5);
    expect(request).toHaveBeenCalledWith('timeline-2', 4.5);
    expect(calls).toEqual(['before:timeline-2:4.5', 'request:timeline-2:4.5']);
  });

  test('given the interceptor, when it intercepts arguments, then it returns them unchanged and broadcasts a copy', () => {
    // given
    const eventbus = new Eventbus();
    const broadcast = vi.spyOn(eventbus, 'broadcast');
    const interceptor = new RequestVideoUriInterceptor(eventbus);
    const args: [string, number?] = ['timeline-1'];

    // test
    const result = interceptor.intercept(args);

    // expect
    expect(result).toBe(args);
    expect(broadcast).toHaveBeenCalledWith('before-request-timeline-uri', [
      'timeline-1',
    ]);
    expect(broadcast.mock.calls[0][1]).not.toBe(args);
  });
});
