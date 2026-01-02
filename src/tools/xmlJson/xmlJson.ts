import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export class XmlJson {
    static xmlToJson(xml: string): string {
        if (!xml || !xml.trim()) throw new Error('Empty XML');
        try {
            const parser = new XMLParser({ ignoreAttributes: false, ignoreDeclaration: true, alwaysCreateTextNode: false });
            const obj = parser.parse(xml);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            throw new Error('Invalid XML');
        }
    }

    static jsonToXml(jsonStr: string): string {
        if (!jsonStr || !jsonStr.trim()) throw new Error('Empty JSON');
        try {
            const obj = JSON.parse(jsonStr);
            const builder = new XMLBuilder({ format: true });
            return builder.build(obj);
        } catch (e) {
            throw new Error('Invalid JSON');
        }
    }
}
