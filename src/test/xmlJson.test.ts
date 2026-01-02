import * as assert from 'assert';
import { XmlJson } from '../tools/xmlJson/xmlJson';

suite('XmlJson Tests', () => {
    test('xmlToJson simple', () => {
        const xml = '<root><a>1</a></root>';
        const out = XmlJson.xmlToJson(xml);
        const obj = JSON.parse(out);
        assert.strictEqual(obj.root.a, '1');
    });

    test('jsonToXml simple', () => {
        const json = '{"root":{"a":"1"}}';
        const out = XmlJson.jsonToXml(json);
        assert.ok(/<a>1<\/a>/.test(out));
    });

    test('jsonToXml invalid json', () => {
        assert.throws(() => XmlJson.jsonToXml('not json'));
    });

    test('xmlToJson invalid xml', () => {
        assert.throws(() => XmlJson.xmlToJson('<root><a></root>'));
    });
});
