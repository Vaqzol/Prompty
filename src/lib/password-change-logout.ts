import { signOut } from 'next-auth/react';

/** A successful password change invalidates the old session even if sign-out fails. */
export async function signOutAfterPasswordChange() {
  try { await signOut({ redirect: false }); }
  catch { /* The old password's session is already invalidated on the server. */ }
  window.location.assign('/login');
}
