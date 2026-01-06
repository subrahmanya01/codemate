import * as assert from 'assert';
import { QuickHash } from '../tools/quickHash/quickHash';

suite('QuickHash Tests', () => {
    test('hash sha256 hex', () => {
        const out = QuickHash.hash('hello', 'sha256', 'hex');
        // precomputed
        assert.strictEqual(out, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    test('hash sha256 base64', () => {
        const out = QuickHash.hash('hello', 'sha256', 'base64');
        assert.strictEqual(out, 'LPJNul+wow4m6DsqxbnimeGxheuB/p0JecwQzYpOLmCQ=');
    });

    test('hmac sha256 consistency hex/base64', () => {
        const hex = QuickHash.hmac('hello', 'secret', 'sha256', 'hex');
        const b64 = QuickHash.hmac('hello', 'secret', 'sha256', 'base64');
        assert.strictEqual(b64, Buffer.from(hex, 'hex').toString('base64'));
        assert.strictEqual(hex.length, 64);
    });
});
