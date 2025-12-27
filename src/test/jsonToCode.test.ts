import * as assert from 'assert';
import { JsonToCode } from '../tools/jsonToCode/jsonToCode';
import * as fs from 'fs';
import * as path from 'path';

suite('JsonToCode Tests', () => {
    const rulesPath = path.join(__dirname, '..', '..', 'resources', 'configurations', 'jsonToCode.rules.json');
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

    test('generates TypeScript interface for simple object', () => {
        const json = JSON.stringify({ name: 'Alice', age: 30, isActive: true });
        const out = JsonToCode.generate(json, 'typescript', rules, 'Person');
        assert.ok(out.includes('export interface Person'));
        assert.ok(out.includes('name: string;'));
        assert.ok(out.includes('age: number;'));
        assert.ok(out.includes('isActive: boolean;'));
    });

    test('throws on invalid JSON', () => {
        assert.throws(() => JsonToCode.generate('{ bad json', 'typescript', rules), /Invalid JSON/);
    });

    test('throws on non-object top level', () => {
        assert.throws(() => JsonToCode.generate('[1,2,3]', 'typescript', rules), /Top-level JSON must be an object/);
    });

    test('generates nested interfaces for objects and arrays', () => {
        const json = JSON.stringify({
            name: 'John Doe',
            age: 25,
            email: 'john.doe@example.com',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              zip: '12345'
            },
            phoneNumbers: [
              { type: 'home', number: '555-555-5555' },
              { type: 'work', number: '555-555-5556' }
            ]
        });

        const out = JsonToCode.generate(json, 'typescript', rules, 'Root');
        assert.ok(out.includes('export interface Address'));
        assert.ok(out.includes('street: string;'));
        assert.ok(out.includes('export interface PhoneNumber'));
        assert.ok(out.includes('type: string;'));
        assert.ok(out.includes('number: string;'));
        assert.ok(out.includes('address: Address;'));
        assert.ok(out.includes('phoneNumbers: PhoneNumber[];'));
    });

    test('C# properties use PascalCase', () => {
        const json = JSON.stringify({ firstName: 'John', last_name: 'Doe', age: 30 });
        const out = JsonToCode.generate(json, 'csharp', rules, 'Person');
        assert.ok(out.includes('public string FirstName { get; set; }'));
        assert.ok(out.includes('public string LastName { get; set; }'));
        assert.ok(out.includes('public double Age { get; set; }'));
    });
});
