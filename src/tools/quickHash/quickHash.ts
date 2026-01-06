import * as crypto from 'crypto';

export type HashAlg = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';
export type OutputEncoding = 'hex' | 'base64';

export class QuickHash {
    public static normalizeAlg(alg: string): HashAlg {
        const s = (alg || '').toLowerCase();
        if (s === 'md5') return 'md5';
        if (s === 'sha1') return 'sha1';
        if (s === 'sha256') return 'sha256';
        if (s === 'sha384') return 'sha384';
        return 'sha512';
    }

    public static hash(input: string, alg: HashAlg, encoding: OutputEncoding = 'hex'): string {
        const h = crypto.createHash(alg);
        h.update(input, 'utf8');
        return h.digest(encoding);
    }

    public static hmac(input: string, secret: string, alg: HashAlg, encoding: OutputEncoding = 'hex'): string {
        const h = crypto.createHmac(alg, secret || '');
        h.update(input, 'utf8');
        return h.digest(encoding);
    }
}
