import { expect, assert} from 'chai';
import '../db.mjs';
import * as functions from '../functions.mjs';

Object.assign(global, functions);

describe ('functions', function() {
    describe('getObscurityStat', function() {
        it('returns a decimal when an array of tracks is passed in', function() {
            expect(getObscurityStat([{popularity:23}, {popularity:51}, {popularity:34}])).to.be.equal('0.36');
        });
        it('returns NaN when an empty array is passed in', function() {
            const output = functions.getObscurityStat([]);
            assert(isNaN(output))
        });
    });
});