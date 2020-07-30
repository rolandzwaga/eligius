export default ProgressbarController;
declare class ProgressbarController {
    selectedElement: any;
    textElement: any;
    detachers: any[];
    name: string;
    init(operationData: any): void;
    attach(eventbus: any): void;
    detach(eventbus: any): void;
    positionUpdateHandler({ position, duration }: {
        position: any;
        duration: any;
    }): void;
    clickHandler(): void;
}
