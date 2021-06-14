import { expect } from 'chai';
import { WebpackResourceImporter } from '../../../importer/webpack-resource-importer';

describe('WebpackResourceImporter', () => {
  let importer = null;
  const operations = [
    'addClass',
    'addControllerToElement',
    'addOptionList',
    'animate',
    'animateWithClass',
    'broadcastEvent',
    'clearElement',
    'clearOperationData',
    'createElement',
    'customFunction',
    'endAction',
    'endLoop',
    'extendController',
    'getControllerFromElement',
    'getControllerInstance',
    'getElementDimensions',
    'getImport',
    'loadJSON',
    'log',
    'removeClass',
    'removeControllerFromElement',
    'removeElement',
    'removePropertiesFromOperationData',
    'reparentElement',
    'requestAction',
    'resizeAction',
    'selectElement',
    'setElementAttributes',
    'setElementContent',
    'setOperationData',
    'setStyle',
    'startAction',
    'startLoop',
    'toggleClass',
    'toggleElement',
    'wait',
  ];
  const controllers = [
    'EventListenerController',
    'LabelController',
    'LottieController',
    'NavigationController',
    'ProgressbarController',
    'RoutingController',
    'SubtitlesController',
  ];

  beforeEach(() => {
    importer = new WebpackResourceImporter();
  });

  it('should return all the operation names', () => {
    var operationNames = importer.getOperationNames();
    expect(operationNames).to.not.be.null;
    expect(operationNames.length).to.not.equal(0);
    operationNames.forEach(name => {
      expect(operations).to.contain(name);
    });
  });

  it('should return all the controller names', () => {
    var controllerNames = importer.getControllerNames();
    expect(controllerNames).to.not.be.null;
    expect(controllerNames.length).to.not.equal(0);
    controllerNames.forEach(name => {
      expect(controllers).to.contain(name);
    });
  });

  it('should return all known operations', () => {
    operations.forEach(op => {
      const imported = importer.import(op);
      expect(imported).to.not.equal(null);
      expect(imported[op]).to.not.equal(null);
    });
  });

  it('should return all known controllers', () => {
    controllers.forEach(op => {
      const imported = importer.import(op);
      expect(imported).to.not.equal(null);
      expect(imported[op]).to.not.equal(null);
    });
  });

  it('should return all known timeline providers', () => {
    const providers = [
      'JwPlayerTimelineProvider',
      /*'MediaElementTimelineProvider',*/ 'RequestAnimationFrameTimelineProvider',
    ];

    providers.forEach(op => {
      const imported = importer.import(op);
      expect(imported).to.not.be.null;
      expect(imported[op]).to.not.be.null;
    });
  });
});
