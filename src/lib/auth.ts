import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super_secret_key_for_development_only';
const encodedKey = new TextEncoder().encode(secretKey);

export async function signToken(payload: { id: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as { id: string; email: string; role: string; exp: number };
  } catch (error) {
    return null;
  }
}
