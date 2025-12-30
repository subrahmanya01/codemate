export class CodeToJson {
    static parse(input: string, language?: string, rules?: any) {
        const lines = input.split(/\r?\n/);
        const types: Record<string, Record<string, string>> = {};
        let current: string | null = null;

        const cfg = (rules && language && rules[language] && rules[language].parsing) ? rules[language].parsing : null;

        const headerRegexes = cfg && cfg.headerRegex ? cfg.headerRegex.map((p: string) => new RegExp(p, 'i')) : [
            /^\s*(?:export\s+)?(?:interface|class)\s+([A-Za-z0-9_]+)/i, // ts/js
            /^\s*(?:public\s+)?(?:class|interface)\s+([A-Za-z0-9_]+)/i, // java/csharp/kotlin
            /^\s*type\s+([A-Za-z0-9_]+)\s+struct\b/i, // go
            /^\s*class\s+([A-Za-z0-9_]+)/i // python/ruby
        ];

        const propertyPatterns = cfg && cfg.propertyPatterns ? cfg.propertyPatterns.map((p: any) => ({ re: new RegExp(p.pattern, 'i'), groups: p.groups })) : null;

        for (let rawLine of lines) {
            const line = rawLine.split('//')[0].trim(); // strip comments
            if (!line) {
                current = null;
                continue;
            }

            // header detection
            let headerMatch = null as RegExpMatchArray | null;
            for (const r of headerRegexes) {
                const m = line.match(r as RegExp);
                if (m) {
                    headerMatch = m;
                    break;
                }
            }
            if (headerMatch) {
                current = headerMatch[1];
                if (!types[current]) types[current] = {};
                continue;
            }

            if (!line.includes(':') && !line.includes('{') && !line.includes('}')) {
                current = line.split(/\s+/)[0];
                if (!types[current]) types[current] = {};
                continue;
            }

            if (!current) continue;

            // if we have config-driven property patterns, use them first
            if (propertyPatterns) {
                let matched = false;
                for (const p of propertyPatterns) {
                    const m = line.match(p.re);
                    if (!m) continue;
                    const captures = m.slice(1).map(s => (s || '').trim());
                    let name = '';
                    let type = 'any';
                    if (p.groups && p.groups.length) {
                        for (let i = 0; i < p.groups.length; i++) {
                            const g = p.groups[i];
                            const val = captures[i] || '';
                            if (g === 'name') name = val;
                            if (g === 'type') type = val;
                        }
                        if (!name && captures.length >= 2) {
                            // fallback heuristic
                            name = captures[captures.length-1];
                        }
                    } else {
                        // assume first capture is name, second is type otherwise
                        if (captures.length === 1) {
                            name = captures[0];
                        } else if (captures.length >= 2) {
                            name = captures[0];
                            type = captures[1];
                        }
                    }
                    if (name) {
                        types[current][name] = type;
                        matched = true;
                        break;
                    }
                }
                if (matched) continue;
            }

            // fallback: use aggregated patterns or a small generic set
            // If no propertyPatterns provided for language, attempt to aggregate patterns from all rules
            // (this keeps parsing configurable via rules file and avoids hardcoded language cases)
            if (!propertyPatterns && rules) {
                // try to build aggregated patterns from rules
                const agg: Array<{ re: RegExp, groups?: string[] }> = [];
                for (const langKey of Object.keys(rules)) {
                    const p = rules[langKey] && rules[langKey].parsing && rules[langKey].parsing.propertyPatterns;
                    if (!p) continue;
                    for (const item of p) {
                        try {
                            agg.push({ re: new RegExp(item.pattern, 'i'), groups: item.groups });
                        } catch (e) {
                            // ignore malformed regex
                        }
                    }
                }

                let matchedAgg = false;
                for (const p of agg) {
                    const m = line.match(p.re);
                    if (!m) continue;
                    const captures = m.slice(1).map(s => (s || '').trim());
                    let name = '';
                    let type = 'any';
                    if (p.groups && p.groups.length) {
                        for (let i = 0; i < p.groups.length; i++) {
                            const g = p.groups[i];
                            const val = captures[i] || '';
                            if (g === 'name') name = val;
                            if (g === 'type') type = val;
                        }
                        if (!name && captures.length >= 2) {
                            name = captures[captures.length - 1];
                        }
                    } else {
                        if (captures.length === 1) {
                            name = captures[0];
                        } else if (captures.length >= 2) {
                            name = captures[0];
                            type = captures[1];
                        }
                    }
                    if (name) {
                        types[current][name] = type;
                        matchedAgg = true;
                        break;
                    }
                }
                if (matchedAgg) continue;
            }

            // final generic fallback: simple name:type or type name forms
            const generic1 = line.match(/^\s*(?:public|private|protected|readonly|static|final|var|let|const)?\s*([A-Za-z0-9_]+)\??\s*:\s*([^;=\{]+)/i);
            if (generic1) {
                const key = generic1[1].trim();
                const type = generic1[2].trim();
                types[current][key] = type;
                continue;
            }
            const generic2 = line.match(/^\s*([A-Za-z0-9_<>,\[\]]+)\s+([A-Za-z0-9_]+)\s*[;\{]?/i);
            if (generic2) {
                const type = generic2[1].trim();
                const key = generic2[2].trim();
                types[current][key] = type;
                continue;
            }
        }

        return types;
    }

    static defaultForType(type: string, types: Record<string, Record<string, string>>, seen = new Set<string>()) : any {
        if (!type) return {};

        const parts = type.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length > 1) {
            const pick = parts.find(p => p.toLowerCase() !== 'null' && p.toLowerCase() !== 'undefined') || parts[0];
            return this.defaultForType(pick, types, seen);
        }

        type = type.replace(/^Promise<(.+)>$/i, '$1').trim();

        const arrMatch = type.match(/^(.+)\[\]$/);
        if (arrMatch) {
            return [];
        }
        const arrayGeneric = type.match(/^Array<(.+)>$/i);
        if (arrayGeneric) return [];

        const lower = type.toLowerCase();
        if (lower === 'string' || lower === 'text' || lower === 'uuid' || lower === 'date' || lower === 'datetime' || lower === 'string?') return '';
        if (lower === 'number' || lower === 'int' || lower === 'float' || lower === 'double' || lower === 'long' || lower === 'integer') return 0;
        if (lower === 'boolean' || lower === 'bool') return false;
        if (lower === 'null') return null;
        if (lower === 'any' || lower === 'object' || lower === 'map' || lower.startsWith('record') || lower.startsWith('{')) return {};

        const plainName = type.split('<')[0].trim();
        if (types[plainName] && !seen.has(plainName)) {
            seen.add(plainName);
            const obj: Record<string, any> = {};
            for (const k of Object.keys(types[plainName])) {
                obj[k] = this.defaultForType(types[plainName][k], types, seen);
            }
            seen.delete(plainName);
            return obj;
        }

        return {};
    }

    static generate(input: string, language?: string, rules?: any): string {
        const types = this.parse(input, language, rules);

        let root: string | undefined = undefined;
        const keys = Object.keys(types);
        if (keys.length > 0) root = keys[keys.length - 1];

        if (!root) {
            const topProps: Record<string,string> = {};
            const lines = input.split(/\r?\n/);
            for (let rawLine of lines) {
                const line = rawLine.split('//')[0].trim();
                if (!line) continue;
                const m = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*([^;#]+)/);
                if (!m) continue;
                const key = m[1].trim();
                const type = m[2].trim().replace(/[;,]$/g, '').trim();
                topProps[key] = type;
            }
            if (Object.keys(topProps).length > 0) {
                const out: Record<string, any> = {};
                for (const k of Object.keys(topProps)) {
                    out[k] = this.defaultForType(topProps[k], types);
                }
                return JSON.stringify(out, null, 2);
            }

            return '{}';
        }

        const out: Record<string, any> = {};
        for (const k of Object.keys(types[root])) {
            out[k] = this.defaultForType(types[root][k], types);
        }

        return JSON.stringify(out, null, 2);
    }
}
