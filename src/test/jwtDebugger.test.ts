import * as assert from 'assert';
import * as crypto from 'crypto';
import { JwtDebugger } from '../tools/jwtDebugger/jwtDebugger';

suite('JwtDebugger Tests', () => {
    test('base64Url decode should parse header and payload', () => {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: '12345', name: 'Alice' };
        const h = Buffer.from(JSON.stringify(header)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const p = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const signingInput = `${h}.${p}`;
        const sig = crypto.createHmac('sha256', 'secret').update(signingInput).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const token = `${h}.${p}.${sig}`;

        const decoded = JwtDebugger.decode(token);
        assert.strictEqual((decoded.header as any).alg, 'HS256');
        assert.strictEqual((decoded.payload as any).name, 'Alice');
        assert.strictEqual(JwtDebugger.detectAlg(token), 'HS256');
        assert.strictEqual(JwtDebugger.verifyHMAC(token, 'secret', 'HS256'), true);
        assert.strictEqual(JwtDebugger.verifyHMAC(token, 'wrong', 'HS256'), false);
    });

    test('RSA verify should validate signature', () => {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

        const header = { alg: 'RS256', typ: 'JWT' };
        const payload = { iss: 'test', sub: 'rsa' };
        const h = Buffer.from(JSON.stringify(header)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const p = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const signingInput = `${h}.${p}`;

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signingInput);
        signer.end();
        const signature = signer.sign(privateKey);
        const sig = signature.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const token = `${h}.${p}.${sig}`;

        // publicKey exported as KeyObject will work with verify
        const publicPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();

        assert.strictEqual(JwtDebugger.detectAlg(token), 'RS256');
        assert.strictEqual(JwtDebugger.verifyRSA(token, publicPem, 'RS256'), true);

        // tamper payload
        const p2 = Buffer.from(JSON.stringify({ iss: 'attacker', sub: 'rsa' })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const badToken = `${h}.${p2}.${sig}`;
        assert.strictEqual(JwtDebugger.verifyRSA(badToken, publicPem, 'RS256'), false);
    });
});