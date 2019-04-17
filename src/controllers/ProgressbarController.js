import TimelineEventNames from "../timeline-event-names";

class ProgressbarController {

	constructor() {
		this.selectedElement = null;
		this.textElement = null;
		this.detachers = [];
		this.name = "ProgressbarController";
	}

	init(operationData) {
		this.selectedElement = operationData.selectedElement;
		this.playerId = operationData.playerId;
		this.textElement = operationData.textElement;
	}

	attach(eventbus) {
		this.detachers.push(eventbus.on(TimelineEventNames.POSITION_UPDATE, this.positionUpdateHandler.bind(this), this.playerId));
		const clickHandler = this.clickHandler.bind(this);
		this.selectedElement.on("click", clickHandler);
		this.detachers.push(()=> this.selectedElement.off("click"), clickHandler);
	}

	detach(eventbus) {
		this.detacher.forEach((func)=> {
			func();
		});
	}

	positionUpdateHandler(position, duration) {
		let perc = (100 / duration) * position;
		if (this.selectedElement) {
			this.selectedElement.css("width", `${perc}%`);
		}
		perc = Math.floor(perc);
		if (this.textElement) {
			this.textElement.text(`${perc}%`);
		}
	}

	clickHandler() {

	}
}

export default ProgressbarController;
