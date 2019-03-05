import $ from 'jquery';

class NavigationController {

	constructor() {
		this.name = "NavigationController";
		this.playerId = null;
		this.navigation = null;
		this.navLookup = {};
		this.navVidIdLookup = {};
		this.ctrlLookup = {};
		this.activeNavigationPoint = null;
		this.labelControllers = null;
		this.eventhandlers = null;
		this.eventbus = null;
		this.container = null;
	}

	init(operationData) {
		this.container = operationData.selectedElement;
		this.playerId = operationData.playerId;
		this.navigation = this.buildNavigationData(operationData.json);
	}

	attach(eventbus) {
		this.eventhandlers = [];
		this.labelControllers = [];
		this.eventhandlers.push(eventbus.on("navigate-to-video-url", this.handleNavigateVideoUrl.bind(this)));
		this.eventhandlers.push(eventbus.on("highlight-navigation", this.highlightMenu.bind(this)));
		this.eventhandlers.push(eventbus.on("request-current-navigation", this.handleRequestCurrentNavigation.bind(this)));
		this.eventhandlers.push(eventbus.on("video-complete", this.handleVideoComplete.bind(this), this.playerId));
		this.eventbus = eventbus;

        this.buildHtml(this.container, this.navigation);
        this.initHistory.bind(this);
	}

	initHistory() {
		this.activeNavigationPoint = this.navVidIdLookup[0];
		const navId = this.getQueryVariable(0);
		let videoIndex = 0;
		if (navId) {
			const nav = this.navLookup[navId];
			videoIndex = nav.videoUrlIndex;
		}
		this.highlightMenu(videoIndex);
	}

	getQueryVariable(variableIdx) {
		const href = window.location.href;
		const hashIndex = href.indexOf("#");
		if (hashIndex > -1) {
			const query = href.substring(hashIndex + 2);
			if (query) {
				const vars = query.split("/");
				return vars[variableIdx];
			}
		}
		return null;
	}

	handleRequestCurrentNavigation(resultCallback) {
		resultCallback({
			navigationData: this.activeNavigationPoint,
			title: this.ctrlLookup[this.activeNavigationPoint.labelId].labelData[this.ctrlLookup[this.activeNavigationPoint.labelId].currentLanguage]
		});
	}

	 detach(eventbus) {
		if (this.eventhandlers) {
			this.eventhandlers.forEach((handler) => {
				handler();
			});
		}
		this.labelControllers.forEach((ctrl) => {
			ctrl.detach(eventbus);
		});
		this.labelControllers.length = 0;
		this.eventbus = null;
		this.container = null;
		window.onpopstate = null;
	}

	pushCurrentState(position = -1) {
		const state = {
			navigationData: this.activeNavigationPoint,
			title: this.ctrlLookup[this.activeNavigationPoint.labelId].labelData[this.ctrlLookup[this.activeNavigationPoint
				.labelId].currentLanguage]
		};
		if (position > -1) {
			state.position = position;
		}
		this.eventbus.broadcast("push-history-state",[state]);
	}

	buildHtml(parentElm, data) {
		const ul = $("<ul/>");
		data.forEach(this.addNavElement.bind(this, ul));
		parentElm.append(ul);
	}

	addNavElement(parentElm, data) {
		if (data.visible) {
			const li = $("<li/>");
			const a = $(`<a href="javascript:;" id="nav_${data.videoUrlIndex}"/>`);
			li.append(a);
			this.addLabel(a, data.labelId);
			this.addClickHandler(a, data.videoUrlIndex);
			if (data.children) {
				const ul = $("<ul/>");
				data.children.forEach(this.addNavElement.bind(this, ul));
				li.append(ul);
			}
			parentElm.append(li);
		}
	}

	addClickHandler(parentElm, videoIndex) {
		parentElm.mouseup(this.menuMouseupHandler.bind(this, videoIndex));
	}

	menuMouseupHandler(videoIndex) {
		const navdata = this.navVidIdLookup[videoIndex];
		if (navdata) {
			this.eventbus.broadcast("request-video-url", [navdata.videoUrlIndex]);
			this.handleNavigateVideoUrl(navdata.videoUrlIndex);
		}
	}

	handleNavigateVideoUrl(index, requestedVideoPosition) {
        requestedVideoPosition = (requestedVideoPosition) ? requestedVideoPosition : 0;
		this.highlightMenu(index);
		this.eventbus.broadcast("request-video-url", [index, requestedVideoPosition]);
		this.activeNavigationPoint = this.navVidIdLookup[index];
		this.pushCurrentState(requestedVideoPosition);
	}

	highlightMenu(index) {
		const navElm = $(`#nav_${index}`);
		if (navElm.length) {
			$(".current-menu-item").removeClass("current-menu-item");
			navElm.addClass("current-menu-item");
		}
	}

	handleVideoComplete(index) {
		console.log("Navigation controller received video complete");
		const navData = this.navVidIdLookup[index];
		if (navData.autoNext) {
			console.log("NavigationController.handleVideoComplete - request-video-url: " + navData.next.videoUrlIndex);
			this.eventbus.broadcast("request-video-url", [navData.next.videoUrlIndex]);
		} else {
			console.log("handleVideoComplete - request-video-cleanup");
			this.eventbus.broadcast("request-video-cleanup");
		}
	}

	addLabel(parentElm, labelId) {
		const data = {
				selectedElement: parentElm,
				labelId: labelId
			};
		const resultCallback = (instance)=> {
            instance.init(data);
            instance.attach(this.eventbus);
            this.labelControllers.push(instance);
            this.ctrlLookup[labelId] = instance;
		};
		this.eventbus.broadcast("request-instance", ["LabelController", resultCallback]);
	}

	buildNavigationData(data) {
		const result = [];
		data.navigationData.forEach((nav, index) => {
			this.navLookup[nav.id] = nav;
			this.navVidIdLookup[nav.videoUrlIndex] = nav;
			nav.previous = data.navigationData[index - 1];
		});

		data.navigationData.forEach((nav, index) => {
			if (nav.nextId) {
				nav.next = this.navLookup[nav.nextId];
				delete nav.nextId;
			} else {
				nav.next = data.navigationData[index + 1];
			}
		});

		data.roots.forEach((id) => {
			const nav = this.navLookup[id];
			if (nav.children) {
				nav.children = nav.children.map((id) => {
					return this.navLookup[id];
				});
			}
			result.push(nav);
		});
		return result;
	}
}

export default NavigationController;
