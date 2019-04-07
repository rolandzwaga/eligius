import WebpackResourceImporter from '../../src/importer/webpack-resource-importer';
import { expect } from 'chai';

describe('WebpackResourceImporter', () => {

    let importer = null;

    beforeEach(() => {
        importer = new WebpackResourceImporter();
    });

    it('should return all known operations', () => {
        const operations = ['addClass', 'addControllerToElement', 'addOptionList', 'animate', 'animateWithClass', 'broadcastEvent', 'clearElement', 'clearOperationData', 'customFunction', 'endAction', 'extendController', 'getControllerFromElement', 'getControllerInstance', 'getElementDimensions', 'loadJSON', 'removeClass', 'removeControllerFromElement', 'removeElement', 'reparentElement', 'requestAction', 'resizeAction', 'selectElement', 'setElementAttributes', 'setElementContent', 'setOperationData', 'setStyle', 'startAction', 'toggleClass', 'toggleElement', 'wait'];

        operations.forEach(op => {
            const imported = importer.import(op);
            expect(imported).to.not.equal(null);
            expect(imported[op]).to.not.equal(null);
        })
    });

    it('should return all known controllers', () => {
        const controllers = ['EventListenerController', 'LabelController', 'LottieController', 'NavigationController', 'ProgressbarController', 'RoutingController', 'SubtitlesController'];

        controllers.forEach(op => {
            const imported = importer.import(op);
            expect(imported).to.not.equal(null);
            expect(imported[op]).to.not.equal(null);
        })
    });

});