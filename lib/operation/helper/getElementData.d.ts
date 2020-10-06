/// <reference types="jquery" />
declare function getElementData(name: string, element: JQuery): any;
declare const getElementControllers: (element: JQuery<HTMLElement>) => any;
export { getElementData, getElementControllers };
