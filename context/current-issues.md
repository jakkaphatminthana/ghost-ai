# Issue Log

---

## [2026-05-13] Black screen on sign-in / sign-out

**Status:** Fixed

**Symptom:** Page hangs on a blank black screen after signing in or out.

**Cause:** Redirect loop between `/` and `/sign-in`. After sign-in, Clerk defaults to redirecting `/`, but `await auth()` returns `isAuthenticated: false` before the session cookie is readable server-side, causing an infinite bounce.

**Fix:**
- `<SignIn forceRedirectUrl="/editor" />` — skip `/` after sign-in
- `<SignUp forceRedirectUrl="/editor" />` — same
- `<ClerkProvider afterSignOutUrl="/sign-in">` — go directly to `/sign-in` after sign-out

---

## [2026-05-13] TS error — unknown prop `colorInputBackground` on Clerk `Variables`

**Status:** Fixed

**Cause:** Wrong property name. The correct name is `colorInput`, not `colorInputBackground`.

**Fix:** Changed to `colorInput: "var(--bg-surface)"` in `ClerkProvider` appearance variables.

---