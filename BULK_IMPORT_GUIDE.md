# 📚 Bulk Import Guide - Question Bank

## 🎯 Overview
The bulk import feature allows you to add hundreds of questions to your question bank at once using Excel or CSV files.

## 📋 Step-by-Step Process

### 1. **Download Template**
- Go to `/admin/question-bank`
- Click **"Download Template"** button
- This downloads `question-bank-template.xlsx` with sample data

### 2. **Prepare Your File**
Use the template format with these columns:

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| A | Question Text | ✅ | "What is 2 + 2?" |
| B | Option 1 | ✅ | "3" |
| C | Option 2 | ✅ | "4" |
| D | Option 3 | ✅ | "5" |
| E | Option 4 | ✅ | "6" |
| F | Correct Answer (1-4) | ✅ | "2" (means Option 2 is correct) |
| G | Explanation (Optional) | ❌ | "Basic addition: 2 + 2 = 4" |
| H | Tags (Optional) | ❌ | "math,addition,basic" |

### 3. **File Format Rules**
- **File Types**: `.xlsx`, `.xls`, `.csv`
- **Header Row**: First row contains column names (will be skipped)
- **Correct Answer**: Use 1, 2, 3, or 4 (corresponding to options A, B, C, D)
- **Tags**: Comma-separated values (e.g., "math,algebra,equations")

### 4. **Import Questions**
- Go to `/admin/question-bank`
- Click **"Bulk Import"** button
- Select the category for your questions
- Choose difficulty level (Easy/Medium/Hard)
- Upload your prepared file
- Click **"Import Questions"**

### 5. **Review Results**
After import, you'll see:
- ✅ **Success Count**: Questions imported successfully
- ❌ **Failed Count**: Questions that couldn't be imported
- 📝 **Error Details**: Specific reasons for failures

## 📝 Example Data

```
Question Text,Option 1,Option 2,Option 3,Option 4,Correct Answer,Explanation,Tags
"What is the capital of France?",London,Berlin,Paris,Madrid,3,"Paris is the capital of France",geography,capitals,europe
"What is 5 x 6?",25,30,35,40,2,"5 x 6 = 30",math,multiplication,basic
"Which planet is closest to the Sun?",Venus,Mercury,Earth,Mars,2,"Mercury is the first planet",science,planets,solar-system
```

## ⚠️ Common Issues & Solutions

### **"Missing required fields"**
- Ensure all first 6 columns have data
- Check for empty cells in question text or options

### **"Invalid correct answer"**
- Use only 1, 2, 3, or 4
- Don't use letters (A, B, C, D)

### **"File format not supported"**
- Use `.xlsx`, `.xls`, or `.csv` files only
- Ensure file isn't corrupted

### **"Category not found"**
- Create the category first before importing
- Check category name spelling

## 🚀 Tips for Large Imports

1. **Test First**: Import 5-10 questions to test format
2. **Backup**: Keep original files as backup
3. **Validate**: Check your data before importing
4. **Batch Size**: Import 100-200 questions at a time for better performance
5. **Tags**: Use consistent tag naming for better organization

## 📊 After Import

- Questions appear in the selected category
- Can be used in Battle Quizzes with random selection
- Filter by difficulty, tags, or category
- Edit individual questions if needed

## 🔄 Using Imported Questions

Once imported, these questions can be used in:
- **Battle Quizzes**: Select category and quantity
- **Practice Exams**: Manual selection
- **Question of the Day**: Random selection

The system will automatically pick random questions from your imported pool! 🎯 