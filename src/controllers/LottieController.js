import lottie from 'lottie-web';
import TimelineEventNames from '../timeline-event-names';

class LottieController {

	constructor() {
		this.name = "LottieController";
		this.currentLanguage = null;
		this.labelData = {};
		this.listeners = [];
		this.anim = null;
		this.operationData = null;
		this.serializedData = null;
		this.serializedIEData = null;
		this.animationData = null;
		this.freezePosition = -1;
		this.endPosition = -1;
	}

	init(operationData) {
		this.operationData = {
			selectedElement: operationData.selectedElement,
			renderer: operationData.renderer,
			loop: operationData.loop,
			autoplay: operationData.autoplay,
			animationData: operationData.animationData,
			json: operationData.json,
			labelIds: operationData.labelIds,
			viewBox: operationData.viewBox
		};
		if (operationData.url.indexOf("[") > -1) {
			this.parseFilename(operationData.url);
		}
		this.serializedData = this.operationData.json
			? JSON.stringify(this.operationData.json)
			: JSON.stringify(this.operationData.animationData);
		if (this.operationData.iefallback) {
			this.serializedIEData = JSON.stringify(this.operationData.iefallback);
		}
	}

	parseFilename(name) {
		const params = name.substr(name.indexOf("[") + 1, name.indexOf("]") - name.indexOf("[") - 1);
		const settings = params.split(",");
		settings.forEach((setting) => {
			const values = setting.split("=");
			if (values[0] === "freeze") {
				this.freezePosition = +values[1];
			} else if (values[0] === "end") {
				this.endPosition = +values[1];
			}
		});
	}

	attach(eventbus) {
		const { labelIds } = this.operationData; 
		if ((labelIds) && (labelIds.length)) {
			const resultHolder = {};
			
			eventbus.broadcast(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, [resultHolder]);
			this.currentLanguage = resultHolder.language;
			this.listeners.push(eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
			eventbus.broadcast(TimelineEventNames.REQUEST_LABEL_COLLECTIONS, [this.operationData.labelIds, resultHolder]);
			this.createTextDataLookup(resultHolder.labelCollections);
		}
		this.createAnimation();
	}

	detach(eventbus) {
		this.listeners.forEach((func) => {
			func();
		});
		if (this.anim) {
			if (this.endPosition > -1) {
				this.anim.onComplete = this.destroy.bind(this);
				this.anim.playSegments([this.freezePosition, this.endPosition], true);
			} else {
				this.anim.destroy();
			}
		}
  }
    
	destroy() {
		if (this.anim) {
			this.anim.destroy();
			this.anim = null;
		}
	}

	createAnimation() {
		if (this.anim) {
			this.anim.destroy();
		}
		let serialized = (this.isIE()) ? this.serializedIEData : this.serializedData;

		const { labelIds } = this.operationData;
		if (labelIds && labelIds.length) {
			labelIds.forEach((id) => {
				serialized = serialized.split(`!!${id}!!`).join(this.labelData[id][this.currentLanguage]);
			});
		}
		const animData = JSON.parse(serialized);

		const animationData = {
			autoplay: this.operationData.autoplay,
			container: this.operationData.selectedElement[0],
			loop: this.operationData.loop,
			renderer: this.operationData.renderer,
			animationData: animData
		}

		this.anim = lottie.loadAnimation(animationData);
		if (this.endPosition < 0) {
			this.endPosition = this.anim.timeCompleted;
		}

		if (this.freezePosition > -1) {
			this.anim.playSegments([0, this.freezePosition], true);
		}
		if (this.operationData.viewBox) {
			this.operationData.selectedElement.find("svg").attr('viewBox', this.operationData.viewBox);
		}
	}

	createTextDataLookup(data) {
		data.forEach((infos, index) => {
			infos.forEach((d) => {
				this.labelData[this.operationData.labelIds[index]][d.code] = d.label;
			});
		});
	}

	handleLanguageChange(code) {
		this.currentLanguage = code;
		this.createAnimation();
	}

	isIE() {
		const isIE = false || !!document['documentMode'];

		// Edge 20+
		const isEdge = !isIE && !!window['StyleMedia'];

		return isEdge || isIE;
	}

}

export default LottieController;
