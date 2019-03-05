class SubtitlesController {

	constructor() {
		this.actionLookup = null;
		this.currentLanguage = null;
		this.lastFunc = null;
		this.name = "SubtitlesController";
	}

	attach(eventbus) {
		const detachTime = eventbus.on("time", this.onTimeHandler.bind(this));
		const detachLangChange = eventbus.on("language-change", this.languageChangeHandler.bind(this));
		this.internalDetach = this.internalDetach.bind(this, [detachTime, detachLangChange]);
	}

	detach(eventbus) {
		this.internalDetach();
	}

	internalDetach(detachMethods) {
		if (detachMethods) {
			detachMethods.forEach((f) => {
				f();
			});
		}
	}

	languageChangeHandler(newLanguage) {
		this.currentLanguage = newLanguage;
		if (this.lastFunc) {
			this.lastFunc();
		}
	}

	removeTitle(container) {
		container.text("");
		this.lastFunc = null;
	}

	onTimeHandler(position) {
		const func = this.actionLookup[position];
		if (func) {
			func();
			this.lastFunc = func;
		}
	}

	setTitle(container, titleLanguageLookup) {
		container.text(titleLanguageLookup[this.currentLanguage]);
	}

	createActionLookup(controllerData, container) {
		const subtitleData = controllerData.subtitleData;
		const titles = subtitleData[0].titles;
		const subtitleTimeLookup = {};
		for (let i = 0, ii = titles.length; i < ii; i++) {
			const titleLanguageLookup = {};
			for (let j = 0, jj = subtitleData.length; j < jj; j++) {
				const subs = subtitleData[j];
				titleLanguageLookup[subs.lang] = subs.titles[i].text;
			}
			subtitleTimeLookup[titles[i].duration.start] = this.setTitle.bind(this, container, titleLanguageLookup);
			subtitleTimeLookup[titles[i].duration.end] = this.removeTitle;
		}
		return subtitleTimeLookup;
	}

	init(controllerData) {
		const container = controllerData.selectedElement;
		this.removeTitle = this.removeTitle.bind(this, container);
		this.currentLanguage = controllerData.language;
		this.actionLookup = this.createActionLookup(controllerData, container);
	}
}

export default SubtitlesController;
