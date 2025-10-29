import {vi} from 'vitest';

// simple stub that matches the API you use in your app
vi.mock('lottie-web', () => {
  return {
    // adapt to the exports you consume
    loadAnimation: (_opts: any) => ({
      play: () => {},
      stop: () => {},
      destroy: () => {},
      // any other functions your code calls
    }),
    // if they export default
    default: {
      loadAnimation: (_opts: any) => ({
        play: () => {},
        stop: () => {},
        destroy: () => {},
      }),
    },
  };
});
