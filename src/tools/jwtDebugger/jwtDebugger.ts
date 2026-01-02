import * as crypto from 'crypto';

export interface JwtParts {
    headerRaw: string;
    payloadRaw: string;
    signatureRaw: string;
    header: any;
    payload: any;
    signature: string; // base64url
}

export class JwtDebugger {
    public static splitToken(token: string): { headerRaw: string; payloadRaw: string; signatureRaw: string } {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT: expected three parts separated by dots');
        return { headerRaw: parts[0], payloadRaw: parts[1], signatureRaw: parts[2] };
    }

    public static base64UrlDecode(input: string): string {
        input = input.replace(/-/g, '+').replace(/_/g, '/');
        const pad = input.length % 4;
        if (pad === 2) input += '==';
        else if (pad === 3) input += '=';
        else if (pad !== 0) throw new Error('Illegal base64url string');
        return Buffer.from(input, 'base64').toString('utf8');
    }

    public static safeJsonParse<T = any>(s: string): T | string {
        try {
            return JSON.parse(s);
        } catch {
            return s;
        }
    }

    public static decode(token: string): JwtParts {
        const { headerRaw, payloadRaw, signatureRaw } = this.splitToken(token);
        const headerStr = this.base64UrlDecode(headerRaw);
        const payloadStr = this.base64UrlDecode(payloadRaw);
        const header = this.safeJsonParse(headerStr);
        const payload = this.safeJsonParse(payloadStr);
        return {
            headerRaw,
            payloadRaw,
            signatureRaw,
            header,
            payload,
            signature: signatureRaw
        };
    }

    private static toBase64Url(buffer: Buffer): string {
        return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    public static verifyHMAC(token: string, secret: string, alg: 'HS256' | 'HS384' | 'HS512'): boolean {
        const { headerRaw, payloadRaw, signatureRaw } = this.splitToken(token);
        const signingInput = `${headerRaw}.${payloadRaw}`;
        const hashAlg = alg === 'HS256' ? 'sha256' : alg === 'HS384' ? 'sha384' : 'sha512';
        const hmac = crypto.createHmac(hashAlg, secret).update(signingInput).digest();
        const expected = this.toBase64Url(hmac);
        const a = Buffer.from(signatureRaw);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    }

    public static verifyRSA(token: string, publicKeyPem: string, alg: 'RS256' | 'RS384' | 'RS512'): boolean {
        const { headerRaw, payloadRaw, signatureRaw } = this.splitToken(token);
        const signingInput = `${headerRaw}.${payloadRaw}`;
        const hashAlg = alg === 'RS256' ? 'RSA-SHA256' : alg === 'RS384' ? 'RSA-SHA384' : 'RSA-SHA512';
        const verifier = crypto.createVerify(hashAlg);
        verifier.update(signingInput);
        verifier.end();
        const signature = Buffer.from(signatureRaw.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        try {
            return verifier.verify(publicKeyPem, signature);
        } catch (e) {
            return false;
        }
    }

    public static detectAlg(token: string): string | undefined {
        try {
            const { header } = this.decode(token);
            if (header && (header as any).alg) return (header as any).alg;
            return undefined;
        } catch {
            return undefined;
        }
    }
}
