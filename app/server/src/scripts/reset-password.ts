/**
 * Sets a new password for an account, from the server.
 *
 *   npm run reset-password -- them@example.com
 *   npm run reset-password -- them@example.com "their new password"
 *
 * This is how password recovery works on a deployment with no mail: the
 * self-service flow is closed there, because the only way to deliver a reset
 * token without email would be to hand it back over the API, and whoever
 * receives that token owns the account.
 *
 * With no password given, one is generated and printed. Send it to the person
 * over whatever channel you already trust, and tell them to change it.
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const email = process.argv[2]?.trim().toLowerCase();
const given = process.argv[3];

if (!email) {
  console.error('Usage: npm run reset-password -- <email> [new password]');
  process.exit(1);
}

if (given !== undefined && given.length < 8) {
  console.error('Password must be at least 8 characters — the API enforces the same minimum.');
  process.exit(1);
}

const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as
  | { id: number; email: string }
  | undefined;

if (!user) {
  console.error(`No account found for ${email}.`);
  process.exit(1);
}

// base64url of 12 bytes: 16 characters, no ambiguous punctuation to dictate
// over the phone, and well past anything worth guessing.
const password = given ?? crypto.randomBytes(12).toString('base64url');

const apply = db.transaction(() => {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), user.id);
  // Any reset link already in flight for this account is now stale.
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?').run(user.id);
});
apply();

console.log(`Password for ${user.email} (id ${user.id}) has been changed.`);
if (given === undefined) {
  console.log(`\n  New password: ${password}\n`);
  console.log('Send it over a channel you trust, and tell them to change it after signing in.');
}
