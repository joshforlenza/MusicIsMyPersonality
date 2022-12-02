import { expect, assert} from 'chai';
import '../db.mjs';
import * as functions from '../functions.mjs';

Object.assign(global, functions);

describe ('functions', function() {
    describe('useAccessToken', function() {
        it('returns "error" if response status code is not 200', async function() {
            const output = await functions.useAccessToken("https://api.spotify.com/v1/me/top/tracks","notAToken");
            assert(output==="error");
        });
    });

    describe('getObscurityStat', function() {
        it('returns a decimal when an array of tracks is passed in', function() {
            expect(getObscurityStat([{popularity:23}, {popularity:51}, {popularity:34}])).to.be.equal('0.36');
        });
        it('returns NaN when an empty array is passed in', function() {
            const output = functions.getObscurityStat([]);
            assert(isNaN(output));
        });
    });

    describe('pickSummary', function() {
        it('returns "zeroTaste" summary when argument is greater than 0.70', async function() {
                const output = await functions.pickSummary(0.80);
                assert(output.name==="zeroTaste");
        });
        it('returns "average" summary when argument is greater than 0.40 and less than 0.70', async function() {
                const output = await functions.pickSummary(0.50);
                assert(output.name==="average");
        });
        it('returns "almostSnob" summary when argument is greater than 0.10 and less than 0.40', async function() {
                const output = await functions.pickSummary(0.20);
                assert(output.name==="almostSnob");
        });
        it('returns "musicSnob" summary when argument is less than 0.10', async function() {
                const output = await functions.pickSummary(0.09);
                assert(output.name==="musicSnob");
        });
            
    });
});