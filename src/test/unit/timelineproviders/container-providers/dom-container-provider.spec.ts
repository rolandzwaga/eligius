import {
  beforeEach,
  describe,
  expect,
  type Mock,
  type TestContext,
  test,
  vi,
} from 'vitest';

// Mock jQuery with hoisted mocks
const mocks = vi.hoisted(() => {
  let mockElement: HTMLElement | null = null;

  const createMockElement = (): HTMLElement => {
    return document.createElement('div');
  };

  return {
    getMockElement: () => mockElement,
    setMockElement: (el: HTMLElement | null) => {
      mockElement = el;
    },
    createMockElement,
  };
});

vi.mock('jquery', () => {
  const jQueryMock = vi.fn((selector: string | HTMLElement) => {
    const element =
      typeof selector === 'string' ? mocks.getMockElement() : selector;
    return {
      length: element ? 1 : 0,
      get: vi.fn().mockReturnValue(element),
      0: element,
    };
  });
  return {default: jQueryMock};
});

// Import after mocking
const {DomContainerProvider} = await import(
  '@timelineproviders/container-providers/dom-container-provider.ts'
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type DomContainerProviderTestContext = {
  provider: InstanceType<typeof DomContainerProvider>;
  mockElement: HTMLElement;
  readyCallback: Mock<() => void>;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DomContainerProvider', () => {
  beforeEach<DomContainerProviderTestContext>(context => {
    vi.clearAllMocks();

    // Create mock element
    const mockElement = mocks.createMockElement();
    mocks.setMockElement(mockElement);
    context.mockElement = mockElement;

    // Create provider
    context.provider = new DomContainerProvider({
      selector: '#container',
    });

    // Create callbacks
    context.readyCallback = vi.fn();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Initialization Tests (T035)
  // ───────────────────────────────────────────────────────────────────────────

  describe('initialization', () => {
    test<DomContainerProviderTestContext>('given valid selector, when init called, then resolves successfully', async ({
      provider,
    }) => {
      await expect(provider.init()).resolves.toBeUndefined();
    });

    test<DomContainerProviderTestContext>('given valid selector, when init called, then element is found via jQuery', async ({
      provider,
    }) => {
      await provider.init();
      const $ = (await import('jquery')).default;
      expect($).toHaveBeenCalledWith('#container');
    });

    test<DomContainerProviderTestContext>('given invalid selector, when init called, then rejects with error', async () => {
      mocks.setMockElement(null);
      const provider = new DomContainerProvider({
        selector: '#nonexistent',
      });

      await expect(provider.init()).rejects.toThrow(
        'Container element not found'
      );
    });

    test<DomContainerProviderTestContext>('given provider initialized, when init called again, then resolves without error', async ({
      provider,
    }) => {
      await provider.init();
      await expect(provider.init()).resolves.toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // getContainer Tests (T036)
  // ───────────────────────────────────────────────────────────────────────────

  describe('getContainer', () => {
    test<DomContainerProviderTestContext>('given uninitialized provider, when getContainer called, then returns undefined', ({
      provider,
    }) => {
      expect(provider.getContainer()).toBeUndefined();
    });

    test<DomContainerProviderTestContext>('given initialized provider, when getContainer called, then returns jQuery element', async ({
      provider,
    }) => {
      await provider.init();
      const container = provider.getContainer();
      expect(container).toBeDefined();
      expect(container?.length).toBe(1);
    });

    test<DomContainerProviderTestContext>('given initialized provider, when getContainer called multiple times, then returns same element', async ({
      provider,
    }) => {
      await provider.init();
      const container1 = provider.getContainer();
      const container2 = provider.getContainer();
      expect(container1).toBe(container2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // onContainerReady Tests (T037)
  // ───────────────────────────────────────────────────────────────────────────

  describe('onContainerReady', () => {
    test<DomContainerProviderTestContext>('given callback registered before init, when init completes, then callback is invoked', async ({
      provider,
      readyCallback,
    }) => {
      provider.onContainerReady(readyCallback);
      await provider.init();
      expect(readyCallback).toHaveBeenCalledTimes(1);
    });

    test<DomContainerProviderTestContext>('given callback registered after init, when registered, then callback is invoked immediately', async ({
      provider,
      readyCallback,
    }) => {
      await provider.init();
      provider.onContainerReady(readyCallback);
      expect(readyCallback).toHaveBeenCalledTimes(1);
    });

    test<DomContainerProviderTestContext>('given multiple callbacks registered, when init completes, then all callbacks are invoked', async ({
      provider,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      provider.onContainerReady(callback1);
      provider.onContainerReady(callback2);
      provider.onContainerReady(callback3);

      await provider.init();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    test<DomContainerProviderTestContext>('given init fails, when callback registered, then callback is not invoked', async ({
      readyCallback,
    }) => {
      mocks.setMockElement(null);
      const provider = new DomContainerProvider({
        selector: '#nonexistent',
      });

      provider.onContainerReady(readyCallback);

      try {
        await provider.init();
      } catch {
        // Expected error
      }

      expect(readyCallback).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Destroy Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    test<DomContainerProviderTestContext>('given initialized provider, when destroy called, then getContainer returns undefined', async ({
      provider,
    }) => {
      await provider.init();
      provider.destroy();
      expect(provider.getContainer()).toBeUndefined();
    });

    test<DomContainerProviderTestContext>('given destroyed provider, when onContainerReady called, then callback is not invoked', async ({
      provider,
      readyCallback,
    }) => {
      await provider.init();
      provider.destroy();
      provider.onContainerReady(readyCallback);
      expect(readyCallback).not.toHaveBeenCalled();
    });
  });
});
