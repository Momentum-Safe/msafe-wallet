import {cmp, IsAllowList} from '../src/version';

describe('version', () => {
    it('cmp', () => {
        expect(cmp('2.0.4', '2.0.4')).toEqual(0);
        expect(cmp('2.0.4', '2.0.3')).toEqual(1);
        expect(cmp('2.0.12', '2.0.3')).toEqual(1);
        expect(cmp('2.0.4', '2.0.5')).toEqual(-1);
        expect(cmp('2.0.4', '2.1.1')).toEqual(-1);
        expect(cmp('2.0.4', '1.6.4')).toEqual(1);
        expect(cmp('2.0.4', '3.6.9')).toEqual(-1);
    });
    it('IsAllowList', () => {
        expect(IsAllowList('2.0.5')).toEqual(true);
        expect(IsAllowList('2.0.4')).toEqual(false);
        expect(IsAllowList('2.0.6')).toEqual(true);
        expect(IsAllowList('2.1.1')).toEqual(true);
        expect(IsAllowList('1.6.4')).toEqual(false);
        expect(IsAllowList('3.6.9')).toEqual(true);
    });
});