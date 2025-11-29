# ✨ Automatic Question Generation Setup

AI-powered automatic question generation feature successfully implemented! 

## 🎯 Features

- **AI-Powered Generation**: Uses OpenAI GPT-3.5 or Google Gemini
- **Customizable**: Choose topic, category, difficulty, and number of questions
- **Automatic Saving**: Generated questions are automatically saved to your question bank
- **Multiple Options**: Each question has 4 options with correct answer
- **Explanations**: AI generates explanations for each question

## 🚀 Setup Instructions

### Step 1: Get API Key

Choose one of the following AI providers:

#### Option A: OpenAI (Recommended)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the API key

#### Option B: Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create a new API key
4. Copy the API key

### Step 2: Add API Key to Environment Variables

Add to your `.env.local` file:

```env
# For OpenAI (Option A)
OPENAI_API_KEY=sk-your-openai-api-key-here

# OR for Google Gemini (Option B)
GEMINI_API_KEY=your-gemini-api-key-here

# You can have both, the system will use OpenAI by default
```

### Step 3: Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## 📖 How to Use

### 1. Go to Question Bank Page

Navigate to: `/admin/question-bank`

### 2. Click "Auto Generate Questions" Button

You'll see a purple gradient button with ✨ icon

### 3. Fill in the Form

- **Category**: Select the category where questions should be added
- **Topic/Subject**: Enter the topic (e.g., "Python Programming", "History of India", "Basic Math")
- **Difficulty**: Choose Easy, Medium, or Hard
- **Number of Questions**: Enter 1-20 (default: 5)
- **AI Provider**: Choose OpenAI or Gemini

### 4. Click "Generate Questions"

The AI will:
1. Generate questions based on your topic
2. Create 4 options for each question
3. Mark the correct answer
4. Add explanations
5. Automatically save to your question bank

### 5. Review Generated Questions

Generated questions will appear in your question bank automatically!

## 🎨 Example Topics

Here are some example topics you can try:

- **Programming**: "Python Basics", "JavaScript Functions", "React Hooks"
- **History**: "Indian Independence", "World War 2", "Ancient Civilizations"
- **Science**: "Photosynthesis", "Newton's Laws", "Periodic Table"
- **Math**: "Algebra Basics", "Geometry", "Calculus Derivatives"
- **General Knowledge**: "Indian Geography", "Current Affairs", "Literature"

## ⚙️ API Endpoint

The feature uses a new API endpoint:

```
POST /api/admin/question-bank/generate
```

**Request Body:**
```json
{
  "topic": "Python Programming",
  "categoryId": "category-id-here",
  "difficulty": "MEDIUM",
  "count": 5,
  "provider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "generated": 5,
  "saved": 5,
  "questions": [...],
  "message": "Successfully generated and saved 5 questions."
}
```

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY not configured"
- Make sure API key is added to `.env.local`
- Restart dev server after adding API key
- Check for typos in variable name

### Error: "API rate limit exceeded"
- You've used too many API requests
- Wait a few minutes or upgrade your API plan
- Try reducing the number of questions per request

### Questions not generating
- Check internet connection
- Verify API key is valid
- Check server logs for detailed errors
- Try using the other AI provider (Gemini vs OpenAI)

### Questions generated but not saved
- Check category exists and is accessible
- Verify database connection
- Check server logs for errors

## 💡 Tips

1. **Be Specific**: More specific topics generate better questions
   - ✅ Good: "Python List Comprehensions"
   - ❌ Bad: "Programming"

2. **Start Small**: Generate 5-10 questions first to test

3. **Review Questions**: Always review AI-generated questions before using in quizzes

4. **Edit if Needed**: You can edit generated questions after they're created

5. **Use Tags**: Manually add tags to generated questions for better organization

## 📊 Cost Estimate

### OpenAI GPT-3.5 Turbo
- ~$0.002 per question
- 5 questions ≈ $0.01
- 100 questions ≈ $0.20

### Google Gemini Pro
- Free tier available
- Check current pricing on Google AI Studio

## 🎉 Success!

Your automatic question generation system is ready! Start generating questions now.





