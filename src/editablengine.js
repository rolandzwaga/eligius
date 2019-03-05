import IvpEngine from './engine';

class EditableIvpEngine extends IvpEngine {

    addTimelineAction(url, timeLineAction) {
        super.addTimelineAction(url, timeLineAction);
    }

    removeTimelineAction(timeLineAction) {
        if (timeLineAction.active && timeLineAction.end) {
            timeLineAction.end().then(()=> {
                this.deleteTimeAction(timeLineAction);
            });
        }
    }

    deleteTimeAction(timeLineAction) {
        const start = timeLineAction.duration.start;
        this.deleteMethod(start, timeLineAction);

        let end = timeLineAction.duration.end;
        if (isFinite(end)) {
            this.deleteMethod(end, timeLineAction);
        }
    }

    deleteMethod(position, action) {
        const methods = this._timeLineActionsLookup[position];
        if (methods) {
            const index = this.findMethodIndex(methods, action);
            if (index > -1) {
                methods.splice(index, 1);
            }
        }
    }

    findMethodIndex(methods, timeLineAction) {
        let idx = -1
        methods.some((a,index)=> {
            if (a.id === timeLineAction.id){
                idx = index;
                return true;
            }
            return false;
        });
        return idx;
    }
}

export default EditableIvpEngine;
