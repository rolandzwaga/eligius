import {
    expect
} from 'chai';
import modifyDimensions from "../../../src/operation/helper/modifyDimensions";

describe('modifyDimensions', () => {

    // given
    let dimensions;

    beforeEach(() => {
        dimensions = {
            width: 200,
            height: 300
        };
    });

    // ADDING
    
    it('should modify the height and width by adding 100', () => {
        // test
        modifyDimensions(dimensions, '+100');

        // expect
        expect(dimensions.width).to.be.equal(300);
        expect(dimensions.height).to.be.equal(400);
    });

    it('should modify the height by adding 100', () => {
        // test
        modifyDimensions(dimensions, '+100h');

        // expect
        expect(dimensions.width).to.be.equal(200);
        expect(dimensions.height).to.be.equal(400);
    });

    it('should modify the width by adding 100', () => {
        // test
        modifyDimensions(dimensions, '+100w');

        // expect
        expect(dimensions.width).to.be.equal(300);
        expect(dimensions.height).to.be.equal(300);
    });

    it('should modify the height and width by adding 50%', () => {
        // test
        modifyDimensions(dimensions, '+50%');

        // expect
        expect(dimensions.width).to.be.equal(300);
        expect(dimensions.height).to.be.equal(450);
    });

    it('should modify the height by adding 50%', () => {
        // test
        modifyDimensions(dimensions, '+50h%');

        // expect
        expect(dimensions.width).to.be.equal(200);
        expect(dimensions.height).to.be.equal(450);
    });

    it('should modify the width by adding 50%', () => {
        // test
        modifyDimensions(dimensions, '+50w%');

        // expect
        expect(dimensions.width).to.be.equal(300);
        expect(dimensions.height).to.be.equal(300);
    });

    // SUBTRACTING

    it('should modify the height and width by subtracting 100', () => {
        // test
        modifyDimensions(dimensions, '-100');

        // expect
        expect(dimensions.width).to.be.equal(100);
        expect(dimensions.height).to.be.equal(200);
    });

    it('should modify the height and width by dividing by 100', () => {
        // test
        modifyDimensions(dimensions, '/100');

        // expect
        expect(dimensions.width).to.be.equal(2);
        expect(dimensions.height).to.be.equal(3);
    });

    it('should modify the height and width by multiplying by 100', () => {
        // test
        modifyDimensions(dimensions, '*100');

        // expect
        expect(dimensions.width).to.be.equal(20000);
        expect(dimensions.height).to.be.equal(30000);

    });

});