# Migration error se bachne ke liye: DB Push

Agar `prisma migrate dev` ab bhi error de raha hai, **DailyQuote table** banane ke liye ye use karo:

## Local / Railway dono par

```bash
npx prisma db push
```

Ye command:
- Migration history **nahi** chalati
- Sirf current `schema.prisma` ke hisaab se DB update karti hai
- `DailyQuote` table create ho jayegi (agar pehle se nahi hai)

Uske baad:

```bash
npx prisma generate
```

Phir app chalao. Daily Quote feature ka backend/API same rahega.

---

## Baad mein migrate theek karna ho to

Jab migration history fix karni ho, tab:

1. **Development:** `npx prisma migrate reset` (local DB reset + saari migrations dubara apply)
2. **Production:** Migrations theek hone ke baad `npx prisma migrate deploy` use karna

Abhi ke liye `db push` se kaam chal jayega.
