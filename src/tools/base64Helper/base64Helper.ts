/**
 * Helper class for Base64 encoding and decoding.
 */
export class Base64Helper {
    /**
     * Helps encode a string to Base64 and decode from Base64.
     * @param input Input string to encode
     * @returns Base64 encoded string
     */
    static encode(input: string): string {
        return Buffer.from(input, 'utf-8').toString('base64');
    }

    /**
     * Decodes a Base64 string back to a regular string.
     * @param base64 Base64 encoded string
     * @returns Decoded regular string
     */
    static decode(base64: string): string {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
}