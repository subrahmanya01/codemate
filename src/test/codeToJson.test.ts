import * as assert from 'assert';
import { CodeToJson } from '../tools/codeToJson/codeToJson';
import * as fs from 'fs';
import * as path from 'path';

const rulesPath = path.join(__dirname, '..', '..', 'resources', 'configurations', 'codeToJson.rules.json');
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

suite('CodeToJson Tests', () => {
    test('generates simple JSON with defaults', () => {
        const input = `Person
            name: string
            age: number
            isActive: boolean`;
                    const out = CodeToJson.generate(input, 'typescript', rules);
                    const obj = JSON.parse(out);
                    assert.strictEqual(obj.name, '');
                    assert.strictEqual(obj.age, 0);
                    assert.strictEqual(obj.isActive, false);
                });

                test('generates nested objects and arrays', () => {
                    const input = `Address
            street: string
            city: string

            Friend
            name: string

            Person
            name: string
            address: Address
            friends: Friend[]`;
        const out = CodeToJson.generate(input, 'typescript', rules);
        const obj = JSON.parse(out);
        assert.strictEqual(obj.name, '');
        assert.ok(typeof obj.address === 'object');
        assert.strictEqual(obj.address.street, '');
        assert.ok(Array.isArray(obj.friends));
    });

    test('falls back to last declared type when root not present', () => {
        const input = `A
            x: number

            B
            y: string`;
        const out = CodeToJson.generate(input, undefined, rules); // should pick last declared type (B) using rules
        const obj = JSON.parse(out);
        assert.strictEqual(obj.y, '');
    });

    test('parses interface/class style declarations', () => {
        const input = `export interface Person {\n  name: string;\n  age: number;\n}`;
        const out = CodeToJson.generate(input, 'typescript', rules);
        const obj = JSON.parse(out);
        assert.strictEqual(obj.name, '');
        assert.strictEqual(obj.age, 0);
    });

    test('parses C# style properties', () => {
        const input = `public class Person {\n  public string Name { get; set; }\n  public int Age { get; set; }\n}`;
        const out = CodeToJson.generate(input, 'csharp', rules);
        const obj = JSON.parse(out);
        assert.strictEqual(obj.Name, '');
        assert.strictEqual(obj.Age, 0);
    });

    test('parses Java style fields', () => {
        const input = `public class User {\n  public String firstName;\n  public double age;\n}`;
        const out = CodeToJson.generate(input, 'java', rules);
        const obj = JSON.parse(out);
        assert.strictEqual(obj.firstName, '');
        assert.strictEqual(obj.age, 0);
    });

    test('auto-detects language from rules when none specified', () => {
        const input = `public class User {\n  public String firstName;\n  public double age;\n}`;
        const out = CodeToJson.generate(input, undefined, rules);
        const obj = JSON.parse(out);
        // should still parse fields
        assert.strictEqual(obj.firstName, '');
        assert.strictEqual(obj.age, 0);
    });
});
