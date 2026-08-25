/**
 * Grants admin rights to an existing account.
 *
 *   npm run grant-admin -- you@example.com
 *
 * Deliberately a server-side script: there is no way to make yourself an admin
 * through the API, so a compromised session cannot escalate to admin.
 */
import { db } from '../db.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run grant-admin -- <email>');
  process.exit(1);
}

const user = db.prepare('SELECT id, email, is_admin FROM users WHERE email = ?').get(email) as
  | { id: number; email: string; is_admin: number }
  | undefined;

if (!user) {
  console.error(`No account found for ${email}. Register first, then re-run this.`);
  process.exit(1);
}

if (user.is_admin) {
  console.log(`${user.email} is already an admin.`);
  process.exit(0);
}

db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(user.id);
console.log(`${user.email} (id ${user.id}) is now an admin.`);
