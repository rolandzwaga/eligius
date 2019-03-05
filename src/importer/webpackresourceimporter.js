import JwPlayerFacade from "../jwplayerfacade";
import LabelController from "../controllers/LabelController";
import EventListenerController from "../controllers/EventListenerController";
import LottieController from "../controllers/LottieController";
import NavigationController from "../controllers/NavigationController";
import ProgressbarController from "../controllers/ProgressbarController";
import RoutingController from "../controllers/RoutingController";
import SubtitlesController from "../controllers/SubtitlesController";
import addClass from '../operation/addClass';
import addControllerToElement from '../operation/addControllerToElement';
import addOptionList from '../operation/addOptionList';
import animate from '../operation/animate';
import animateWithClass from '../operation/animateWithClass';
import broadcastEvent from '../operation/broadcastEvent';
import clearElement from '../operation/clearElement';
import clearOperationData from '../operation/clearOperationData';
import customFunction from '../operation/customFunction';
import endAction from '../operation/endAction';
import extendController from '../operation/extendController';
import getControllerFromElement from '../operation/getControllerFromElement';
import getControllerInstance from '../operation/getControllerInstance';
import getElementDimensions from '../operation/getElementDimensions';
import loadJSON from '../operation/loadJSON';
import removeClass from '../operation/removeClass';
import removeControllerFromElement from '../operation/removeControllerFromElement';
import removeElement from '../operation/removeElement';
import reparentElement from '../operation/reparentElement';
import requestAction from '../operation/requestAction';
import resizeAction from '../operation/resizeAction';
import selectElement from '../operation/selectElement';
import setElementAttributes from '../operation/setElementAttributes';
import setElementContent from '../operation/setElementContent';
import setOperationData from '../operation/setOperationData';
import setStyle from '../operation/setStyle';
import startAction from '../operation/startAction';
import toggleClass from '../operation/toggleClass';
import toggleElement from '../operation/toggleElement';
import wait from '../operation/wait';


class WebpackResourceImporter {

    import(name) {
        switch (name) {
            case 'JwPlayerFacade':
                return { JwPlayerFacade: JwPlayerFacade };
            case 'LabelController':
                return { LabelController: LabelController };
            case 'EventListenerController':
                return { EventListenerController: EventListenerController };
            case 'LottieController':
                return { LottieController: LottieController };
            case 'NavigationController':
                return { NavigationController: NavigationController };
            case 'ProgressbarController':
                return { ProgressbarController: ProgressbarController };
            case 'RoutingController':
                return { RoutingController: RoutingController };
            case 'SubtitlesController':
                return { SubtitlesController: SubtitlesController };
            case 'AddClassOperation':
                return { AddClassOperation: addClass };
            case 'AddControllerToElementOperation':
                return { AddControllerToElementOperation: addControllerToElement };
            case 'AddOptionListOperation':
                return { AddOptionListOperation: addOptionList };
            case 'AnimateOperation':
                return { AnimateOperation: animate };
            case 'AnimateWithClassOperation':
                return { AnimateWithClassOperation: animateWithClass };
            case 'BroadcastEventOperation':
                return { BroadcastEventOperation: broadcastEvent };
            case 'ClearElementOperation':
                return { ClearElementOperation: clearElement };
            case 'ClearOperationDataOperation':
                return { ClearOperationDataOperation: clearOperationData };
            case 'CustomFunctionOperation':
                return { CustomFunctionOperation: customFunction };
            case 'EndActionOperation':
                return { EndActionOperation: endAction };
            case 'ExtendControllerOperation':
                return { ExtendControllerOperation: extendController };
            case 'GetControllerFromElementOperation':
                return { GetControllerFromElementOperation: getControllerFromElement };
            case 'GetControllerInstanceOperation':
                return { GetControllerInstanceOperation: getControllerInstance };
            case 'GetElementDimensionsOperation':
                return { GetElementDimensionsOperation: getElementDimensions };
            case 'LoadJSONOperation':
                return { LoadJSONOperation: loadJSON };
            case 'RemoveClassOperation':
                return { RemoveClassOperation: removeClass };
            case 'RemoveControllerFromElementOperation':
                return { RemoveControllerFromElementOperation: removeControllerFromElement };
            case 'RemoveElementOperation':
                return { RemoveElementOperation: removeElement };
            case 'ReparentElementOperation':
                return { ReparentElementOperation: reparentElement };
            case 'RequestActionOperation':
                return { RequestActionOperation: requestAction };
            case 'ResizeActionOperation':
                return { ResizeActionOperation: resizeAction };
            case 'SelectElementOperation':
                return { SelectElementOperation: selectElement };
            case 'SetElementAttributesOperation':
                return { SetElementAttributesOperation: setElementAttributes };
            case 'SetElementContentOperation':
                return { SetElementContentOperation: setElementContent };
            case 'SetOperationDataOperation':
                return { SetOperationDataOperation: setOperationData };
            case 'SetStyleOperation':
                return { SetStyleOperation: setStyle };
            case 'StartActionOperation':
                return { StartActionOperation: startAction };
            case 'ToggleClassOperation':
                return { ToggleClassOperation: toggleClass };
            case 'ToggleElementOperation':
                return { ToggleElementOperation: toggleElement };
            case 'WaitOperation':
                return { WaitOperation: wait };
            default:
                return null;
        }
    }
}

export default WebpackResourceImporter;
