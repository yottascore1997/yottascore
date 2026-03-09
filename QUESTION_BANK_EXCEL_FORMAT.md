# Question Bank – Excel Import Format

Excel/CSV mein **pehli row header** honi chahiye, uske baad har row ek question.

---

## Columns (order fix rahein)

| Column | Header (English) | Required | Description |
|--------|------------------|----------|-------------|
| A | Question Text | ✅ Yes | Question ka poora text |
| B | Option 1 | ✅ Yes | Pehla option |
| C | Option 2 | ✅ Yes | Doosra option |
| D | Option 3 | ✅ Yes | Teesra option |
| E | Option 4 | ✅ Yes | Chautha option |
| F | Correct Answer (1-4) | ✅ Yes | Sahi option ka number: **1, 2, 3 ya 4** (1 = Option 1, 2 = Option 2, …) |
| G | Explanation (Optional) | No | Sahi jawab ki explanation |
| H | Tags (Optional) | No | Comma-separated tags, e.g. `railway,math,reasoning` |

---

## Example 1 – General (Math / GK)

| Question Text | Option 1 | Option 2 | Option 3 | Option 4 | Correct Answer (1-4) | Explanation (Optional) | Tags (Optional) |
|---------------|----------|----------|----------|----------|----------------------|-------------------------|-----------------|
| What is 2 + 2? | 3 | 4 | 5 | 6 | 2 | Basic addition: 2 + 2 = 4 | math,addition,basic |
| Which planet is closest to the Sun? | Venus | Mercury | Earth | Mars | 2 | Mercury is the first planet from the Sun | science,planets |
| What is the capital of France? | London | Berlin | Paris | Madrid | 3 | Paris is the capital of France | geography,capitals |

---

## Example 2 – Railway (Reasoning / GK)

| Question Text | Option 1 | Option 2 | Option 3 | Option 4 | Correct Answer (1-4) | Explanation (Optional) | Tags (Optional) |
|---------------|----------|----------|----------|----------|----------------------|-------------------------|-----------------|
| RRB stands for? | Railway Recruitment Board | Regional Railway Board | Railway Regulatory Body | Railway Research Bureau | 1 | RRB = Railway Recruitment Board | railway,abbreviation,gk |
| First train in India ran between which two cities? | Mumbai and Thane | Delhi and Agra | Kolkata and Howrah | Chennai and Bangalore | 1 | 1853: Mumbai to Thane | railway,history |
| Which zone has maximum number of divisions in Indian Railways? | Northern Railway | Central Railway | Western Railway | Southern Railway | 1 | Northern Railway has 7 divisions | railway,zones |

---

## Example 3 – Short (minimal)

| Question Text | Option 1 | Option 2 | Option 3 | Option 4 | Correct Answer (1-4) | Explanation (Optional) | Tags (Optional) |
|---------------|----------|----------|----------|----------|----------------------|-------------------------|-----------------|
| 5 × 6 = ? | 28 | 30 | 32 | 36 | 2 | 5 × 6 = 30 | math |
| Capital of India? | Mumbai | Delhi | Kolkata | Chennai | 2 | Delhi is the capital | gk,india |

---

## Important points

1. **Correct Answer:** Sirf **1, 2, 3 ya 4** — Option 1 = 1, Option 2 = 2, Option 3 = 3, Option 4 = 4.
2. **Header row:** Pehli row header honi chahiye; import us row ko skip karta hai.
3. **Minimum 6 columns:** Question Text + Option 1–4 + Correct Answer zaroori hain. Explanation aur Tags optional.
4. **File type:** `.xlsx`, `.xls` ya `.csv` use kar sakte hain.
5. **Category:** Import karte waqt admin panel se category (e.g. Railway) select karein; wo saare rows par apply hogi.
6. **Difficulty:** Import form se Easy / Medium / Hard select hota hai; wo saare imported questions par lagta hai.

---

## Template download

Admin → Question Bank → **Bulk Import** → "Download the template" link se official template download kar sakte hain; usi format mein apne questions fill karein.
