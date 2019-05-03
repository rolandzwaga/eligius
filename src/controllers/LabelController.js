import TimelineEventNames from "../timeline-event-names";

class LabelController {

	constructor() {
		this.listeners = [];
		this.currentLanguage = null;
		this.operationData = null;
		this.labelData = {};
		this.name = "LabelController";
	}

	init(operationData) {
		this.operationData = Object.assign({},operationData);
	}

	attach(eventbus) {
		eventbus.broadcast(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, [(language)=> {
			this.currentLanguage = language;
		}]);
		eventbus.broadcast(TimelineEventNames.REQUEST_LABEL_COLLECTION, [this.operationData.labelId, (labelCollection)=> {
			this.createTextDataLookup(labelCollection);
		}]);
		this.setLabel();
		this.listeners.push(eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
	}

	setLabel() {
		this.operationData.selectedElement.html(this.labelData[this.currentLanguage]);
	}

	detach(eventbus) {
		this.listeners.forEach((func) => {
			func();
		});
	}

	handleLanguageChange(code) {
		this.currentLanguage = code;
		this.setLabel();
	}

	createTextDataLookup(data) {
		data.forEach((d) => {
			this.labelData[d.code] = d.label;
		});
	}
}

export default LabelController;
