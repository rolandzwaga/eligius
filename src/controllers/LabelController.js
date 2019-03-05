import $ from 'jquery';

class LabelController {

	constructor() {
		this.listeners = [];
		this.currentLanguage = null;
		this.labelData = {};
		this.name = "LabelController";
	}

	init(operationData) {
		this.operationData = $.extend({},operationData, true);
	}

	attach(eventbus) {
		eventbus.broadcast('request-current-language', [(language)=> {
			this.currentLanguage = language;
		}]);
		eventbus.broadcast('request-label-collection', [this.operationData.labelId, (labelCollection)=> {
			this.createTextDataLookup(labelCollection);
		}]);
		this.setLabel();
		this.listeners.push(eventbus.on('language-change', this.handleLanguageChange.bind(this)));
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
