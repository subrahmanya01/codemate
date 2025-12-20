/**
 * Helper class for Base64 encoding and decoding.
 */
export class Base64Helper {
    static encode(input: string): string {
        return Buffer.from(input, 'utf-8').toString('base64');
    }

    static decode(base64: string): string {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }

    static decodeValidated(base64: string): string {
        const cleaned = (base64 || '').replace(/\s+/g, '');
        const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(padded)) {
            throw new Error('Invalid Base64 string');
        }
        try {
            const decoded = Buffer.from(padded, 'base64').toString('utf8');
            const reencoded = Buffer.from(decoded, 'utf8').toString('base64').replace(/=+$/, '');
            const normalizedOriginal = padded.replace(/=+$/, '');
            if (reencoded !== normalizedOriginal) {
                throw new Error('Invalid Base64 string');
            }
            return decoded;
        } catch (e) {
            throw new Error('Invalid Base64 string');
        }
    }
}