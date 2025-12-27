/**
 * Json to Code conversion logic.
 * Loads language-specific templates from configuration and applies simple type inference
 * Designed to be small and easily extended via the JSON configuration file
 */
export class JsonToCode {
    static inferType(value: any): string {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        switch (typeof value) {
            case 'string': return 'string';
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'object': return 'object';
            default: return 'object';
        }
    }

    static safeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    static propNameForLanguage(name: string, langRule: any): string {
        const caseRule = (langRule && langRule.propertyCase) ? langRule.propertyCase : 'default';
        const cleaned = this.safeName(name);
        switch (caseRule) {
            case 'pascal':
                return this.pascalCase(cleaned);
            case 'camel': {
                const p = this.pascalCase(cleaned);
                return p.charAt(0).toLowerCase() + p.slice(1);
            }
            case 'snake':
                return cleaned.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
            default:
                return cleaned;
        }
    }

    static toType(langRule: any, inferred: string): string {
        if (!langRule) return inferred;
        const map = langRule.typeMap || {};
        return map[inferred] || map['object'] || inferred;
    }

    static toArrayType(langRule: any, elemType: string): string {
        if (!langRule) return elemType + '[]';
        const style = langRule.arrayStyle || 'suffix';
        switch (style) {
            case 'prefix':
                // e.g. []Type (Go)
                return '[]' + elemType;
            case 'generic':
                if (langRule.arrayGenericTemplate) return langRule.arrayGenericTemplate.replace(/{T}/g, elemType);
                return elemType + '[]';
            case 'suffix':
            default:
                return elemType + '[]';
        }
    }

    static pascalCase(name: string): string {
        const cleaned = this.safeName(name);
        return cleaned.split(/[_\s\-]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') || cleaned;
    }

    static singularize(name: string): string {
        if (!name) return name;
        if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
        if (name.endsWith('s')) return name.slice(0, -1);
        return name;
    }

    /**
     * Build a set of named types recursively for objects/arrays and return them in dependency order
     */
    static buildTypes(rootObj: any, langRule: any, rootName: string) {
        const types = new Map<string, { name: string, props: Record<string, string> }>();

        const makeUnique = (base: string) => {
            let candidate = base;
            let i = 1;
            while (types.has(candidate)) {
                candidate = base + i;
                i++;
            }
            return candidate;
        };

        const processObject = (obj: any, name: string) => {
            if (types.has(name)) return;
            const props: Record<string, string> = {};
            types.set(name, { name, props });

            for (const key of Object.keys(obj)) {
                const val = obj[key];
                const inferred = this.inferType(val);
                if (inferred === 'object') {
                    const childBase = this.pascalCase(key);
                    const childName = makeUnique(childBase);
                    processObject(val, childName);
                    props[key] = childName;
                } else if (inferred === 'array') {
                    const arr = Array.isArray(val) ? val : [];
                    const first = arr.find(el => el !== undefined && el !== null);
                    if (!first) {
                        // empty array -> map to configured array type or fallback
                        const mapped = this.toType(langRule, 'array');
                        props[key] = mapped.indexOf('{T}') >= 0 ? mapped.replace(/{T}/g, 'any') : mapped;
                    } else {
                        const elemInferred = this.inferType(first);
                        if (elemInferred === 'object') {
                            const childBase = this.pascalCase(this.singularize(key));
                            const childName = makeUnique(childBase);
                            processObject(first, childName);
                            // language-specific array form (prefix/suffix/generic)
                            props[key] = this.toArrayType(langRule, childName);
                        } else if (elemInferred === 'array') {
                            // nested arrays - fallback
                            const mapped = this.toType(langRule, 'array');
                            props[key] = mapped.indexOf('{T}') >= 0 ? mapped.replace(/{T}/g, 'any') : mapped;
                        } else {
                            const mapped = this.toType(langRule, elemInferred);
                            props[key] = this.toArrayType(langRule, mapped);
                        }
                    }
                } else {
                    props[key] = this.toType(langRule, inferred);
                }
            }
        };

        const rootTypeName = this.pascalCase(rootName);
        processObject(rootObj, rootTypeName);

        const ordered: Array<{ name: string, props: Record<string, string> }> = [];
        for (const [k, v] of types) {
            if (k !== rootTypeName) ordered.push(v);
        }
        if (types.has(rootTypeName)) ordered.push(types.get(rootTypeName)!);
        return ordered;
    }

    static renderType(typeDef: { name: string, props: Record<string, string> }, langRule: any): string {
        const lines: string[] = [];
        const template = langRule.propertyTemplate || '{name}: {type}';
        for (const key of Object.keys(typeDef.props)) {
            const propName = this.propNameForLanguage(key, langRule);
            const propType = typeDef.props[key];
            lines.push(template.replace(/{name}/g, propName).replace(/{type}/g, propType).replace(/{jsonName}/g, key));
        }
        const properties = lines.join('\n');
        const classTemplate = langRule.classTemplate || '{name}\n{properties}';
        return classTemplate.replace(/{name}/g, typeDef.name).replace(/{properties}/g, properties);
    }

    static generate(input: string, languageKey: string, rules: any, rootName = 'Root'): string {
        let parsed: any;
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            throw new Error('Invalid JSON: ' + String(e));
        }

        const langRule = (rules && rules[languageKey]) ? rules[languageKey] : null;
        if (!langRule) throw new Error('Unknown language rule: ' + languageKey);

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('Top-level JSON must be an object with properties');
        }

        const typeDefs = this.buildTypes(parsed, langRule, rootName);
        const rendered = typeDefs.map(t => this.renderType(t, langRule)).join('\n\n');
        return rendered;
    }
}
