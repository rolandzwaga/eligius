import type {LottieController} from '@controllers/lottie-controller.ts';
import type {
  ILottieAnimationEvents,
  ILottieAnimationItem,
  ILottieCanvasRendererConfig,
  ILottieHTMLRendererConfig,
  ILottieSVGRendererConfig,
  TLottieAnimationEventName,
  TLottieRendererConfig,
} from '@controllers/types.ts';
import type {
  AnimationEventName,
  AnimationEvents,
  AnimationItem,
  CanvasRendererConfig,
  HTMLRendererConfig,
  SVGRendererConfig,
} from 'lottie-web';
import {describe, expectTypeOf, test} from 'vitest';

// The public LottieController types mirror lottie-web's types so the published
// declarations need no lottie-web import. These checks run in `npm run
// typecheck` and fail as soon as the two drift apart in either direction.
describe('structural lottie-web types', () => {
  test('given lottie-web AnimationItem, then it matches ILottieAnimationItem both ways', () => {
    expectTypeOf<AnimationItem>().toExtend<ILottieAnimationItem>();
    expectTypeOf<ILottieAnimationItem>().toExtend<AnimationItem>();
  });

  test('given lottie-web animation events, then they match the structural events', () => {
    expectTypeOf<AnimationEventName>().toEqualTypeOf<TLottieAnimationEventName>();
    expectTypeOf<AnimationEvents>().toExtend<ILottieAnimationEvents>();
    expectTypeOf<ILottieAnimationEvents>().toExtend<AnimationEvents>();
  });

  test('given lottie-web renderer configs, then they match the structural configs both ways', () => {
    expectTypeOf<SVGRendererConfig>().toExtend<ILottieSVGRendererConfig>();
    expectTypeOf<ILottieSVGRendererConfig>().toExtend<SVGRendererConfig>();
    expectTypeOf<CanvasRendererConfig>().toExtend<ILottieCanvasRendererConfig>();
    expectTypeOf<ILottieCanvasRendererConfig>().toExtend<CanvasRendererConfig>();
    expectTypeOf<HTMLRendererConfig>().toExtend<ILottieHTMLRendererConfig>();
    expectTypeOf<ILottieHTMLRendererConfig>().toExtend<HTMLRendererConfig>();
  });

  test('given LottieController, then its public lottie members use the structural types', () => {
    expectTypeOf<
      LottieController['animationItem']
    >().toEqualTypeOf<ILottieAnimationItem | null>();
    expectTypeOf<LottieController['operationData']>().toExtend<{
      renderer: TLottieRendererConfig;
    } | null>();
  });
});
