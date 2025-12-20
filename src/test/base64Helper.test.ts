import * as assert from 'assert';
import { Base64Helper } from '../tools/base64Helper/base64Helper';

suite('Base64Helper Tests', () => {
    test('encode should base64 encode a string', () => {
        const out = Base64Helper.encode('hello');
        assert.strictEqual(out, 'aGVsbG8=');
    });

    test('decode should decode a base64 string', () => {
        const out = Base64Helper.decode('aGVsbG8=');
        assert.strictEqual(out, 'hello');
    });

    test('decodeValidated should decode unpadded base64', () => {
        const out = Base64Helper.decodeValidated('aGVsbG8');
        assert.strictEqual(out, 'hello');
    });

    test('decodeValidated should decode base64 with whitespace', () => {
        const out = Base64Helper.decodeValidated('aG V s bG8=');
        assert.strictEqual(out, 'hello');
    });

    test('decodeValidated throws on invalid characters', () => {
        assert.throws(() => Base64Helper.decodeValidated('!!notbase64!!'), /Invalid Base64 string/);
    });

    test('decodeValidated throws on empty input', () => {
        assert.throws(() => Base64Helper.decodeValidated(''), /Invalid Base64 string/);
    });
});
