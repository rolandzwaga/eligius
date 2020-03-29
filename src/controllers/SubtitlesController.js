import TimelineEventNames from '../timeline-event-names';

class SubtitlesController {
  constructor() {
    this.actionLookup = null;
    this.currentLanguage = null;
    this.lastFunc = null;
    this.name = 'SubtitlesController';
  }

  attach(eventbus) {
    const detachTime = eventbus.on(TimelineEventNames.TIME, this.onTimeHandler.bind(this));
    const detachSeek = eventbus.on(TimelineEventNames.SEEKED, this.onSeekedHandler.bind(this));
    const detachLangChange = eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.languageChangeHandler.bind(this));
    this.internalDetach = this.internalDetach.bind(this, [detachTime, detachLangChange, detachSeek]);
  }

  detach(eventbus) {
    this.internalDetach();
  }

  internalDetach(detachMethods) {
    if (detachMethods) {
      detachMethods.forEach(f => {
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
    container.empty();
    this.lastFunc = null;
  }

  onTimeHandler(arg) {
    const position = arg.position;
    const func = this.actionLookup[position];
    if (func) {
      func();
      this.lastFunc = func;
    }
  }

  onSeekedHandler(arg) {
    let position = arg.position;
    let func = this.actionLookup[position];
    while (!func && --position >= 0) {
      func = this.actionLookup[position];
    }
    if (func) {
      func();
      this.lastFunc = func;
    } else {
      this.removeTitle();
    }
  }

  setTitle(container, titleLanguageLookup) {
    container.html(titleLanguageLookup[this.currentLanguage]);
  }

  createActionLookup(operationData, container) {
    const subtitleData = operationData.subtitleData;
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

  init(operationData) {
    const container = operationData.selectedElement;
    this.removeTitle = this.removeTitle.bind(this, container);
    this.currentLanguage = operationData.language;
    this.actionLookup = this.createActionLookup(operationData, container);
  }
}

export default SubtitlesController;
