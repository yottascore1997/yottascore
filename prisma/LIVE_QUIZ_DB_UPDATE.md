# Live Quiz – DB update (no reset)

Production par **kabhi `prisma migrate reset` mat chalao** – isse poora DB drop ho jata hai.

## Option 1: Sirf naye tables add karna (recommended)

Current DB par Live Quiz tables add karne ke liye:

```bash
npx prisma db push
```

- Naye tables `live_quiz_sessions` aur `live_quiz_session_participants` (aur zarurat ho to enums) add ho jayenge.
- Purana data safe rahega.
- Migration history change nahi hoti (migrate history fix karne ki zarurat nahi).

Phir:

```bash
npx prisma generate
```

## Option 2: Baad mein migration history theek karna

- Jo migrations “modified after applied” dikh rahi hain, unko wapas original (lowercase) state mein revert karke checksum match kara sakte ho; ya
- Naya baseline le ke aage se nayi migrations hi chalani padti hain.

Abhi ke liye **Option 1 (`db push`) kaafi hai** – app chalane ke liye Live Quiz tables ban jayengi.

## Summary

| Command | Kab use karein |
|--------|------------------|
| `npx prisma db push` | Abhi: bina reset ke Live Quiz (aur schema diff) apply karna |
| `npx prisma generate` | Push ke baad: Prisma client refresh |
| `npx prisma migrate reset` | **Production par kabhi mat use karo** (sirf local empty DB ke liye) |
