class RoutingController {

	constructor() {
		this.navLookup = {};
		this.navVidIdLookup = {};
		this.playerId = null;
		this.navigation = null;
		this.eventhandlers = [];
		this.eventbus = null;
		this.name = "RoutingController";
	}

	init(operationData) {
		this.navigation = this.buildNavigationData(operationData.json);
		this.playerId = operationData.playerId;
	}

	attach(eventbus) {
		this.eventhandlers.push(eventbus.on("before-request-video-url", this.handleBeforeRequestVideoUrl.bind(this)));
		this.eventhandlers.push(eventbus.on("push-history-state", this.handlePushHistoryState.bind(this)));
		this.eventbus = eventbus;
		window.onpopstate = this.handlePopstate.bind(this);

		const navId = this.getQueryVariable(0);
		if (navId) {
			const nav = this.navLookup[navId];
			let pos = this.getQueryVariable(1);
			pos = (pos) ? +pos : 0;
			this.eventbus.broadcast("request-video-url", [nav.videoUrlIndex, pos, true]);
		} else {
			window.history.pushState({ navigationId: this.navigation[0].id },
				"",
				`#/${this.navigation[0].id}`);
		}
	}

	handlePopstate(event) {
		const navigationId = (event.state) ? event.state.navigationId : this.navigation[0].id;
		const position = (event.state) ? event.state.position : 0;
		const nav = this.navLookup[navigationId];
		this.eventbus.broadcast("highlight-navigation", [nav.videoUrlIndex]);
		this.eventbus.broadcast("request-video-url", [nav.videoUrlIndex, position, true]);
	}

	detach(eventbus) {
		if (this.eventhandlers) {
			this.eventhandlers.forEach((handler) => {
				handler();
			});
		}
		this.eventbus = null;
	}

	handleBeforeRequestVideoUrl(index, requestedVideoPosition, isHistoryRequest) {
        requestedVideoPosition = (requestedVideoPosition) ? requestedVideoPosition : 0;
        isHistoryRequest = (isHistoryRequest !== undefined) ? isHistoryRequest : false;
		if (!isHistoryRequest) {
            const resultCallback = (item)=> {
                this.pushState(item);
            };
			this.eventbus.broadcast("request-current-navigation", [resultCallback]);
		}
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

	handlePushHistoryState(state) {
		this.pushState(state);
	}

	pushState(state) {
		if ((state) && (state.navigationData) && (state.navigationData.visible)) {
			let currentPosition = (state.position !== undefined) ? state.position : -1;
			if (currentPosition < 0) {
				const resultCallback = (position)=> {
                    currentPosition = (position > 3) ? (position - 3) : 0;
                };
				this.eventbus.broadcast("request-current-video-position", [resultCallback]);
			}

			const currentState = window.history.state;
			if ((currentState) && (currentState.navigationId !== state.navigationData.id)) {
				window.history.pushState({ navigationId: state.navigationData.id, position: currentPosition },
					state.title,
					`#/${state.navigationData.id}/${currentPosition}`);
			} else if ((currentState) && (currentState.navigationId === state.navigationData.id)) {
				window.history.replaceState({ navigationId: currentState.navigationId, position: currentPosition },
					state.title,
					`#/${currentState.navigationId}/${currentPosition}`);
			} else {
				window.history.pushState({ navigationId: state.navigationData.id, position: currentPosition },
					state.title,
					`#/${state.navigationData.id}/${currentPosition}`);
			}
			window.document.title = state.title;
		}
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

export default RoutingController;
