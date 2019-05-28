import { expect } from 'chai';
import { TimelineActionEditor } from '../../src/configuration/api/action-editor';

describe('TimelineActionEditor.', () => {

    let timelineActionEditor = null;
    let configurationFactory = null;
    let actionConfig = null;

    beforeEach(() => {
        configurationFactory = {};
        actionConfig = {
            id: '111-222-333',
            name: 'name',
            startOperations: [],
            endOperations: [{
                id: 'test',
                operationData: {}
            }]
        };
        timelineActionEditor = new TimelineActionEditor(configurationFactory, actionConfig);
    });

    it('should set the duration start and end', () => {
        // given

        // test
        timelineActionEditor.setDuration(12, 40).getConfiguration((config) => {
            expect(config.duration.start).to.equal(12);
            expect(config.duration.end).to.equal(40);
        });
    });

    it('should not set end property when end is undefined', () => {
        // given

        // test
        timelineActionEditor.setDuration(12).getConfiguration((config) => {
            expect(config.duration.start).to.equal(12);
            expect(config.duration.hasOwnProperty('end')).to.be.false;
        });
    });

    it('should throw an error when start is higher than end', () => {
        // given
        let errorMessage = null;

        // test
        try {
            timelineActionEditor.setDuration(12, 10);
        } catch(e) {
            errorMessage = e.message;
        }

        // expect
        expect(errorMessage).to.equal('start position cannot be higher than end position');
    })

});