# BreedLink AI Chat Integration

## Setting up Gemini API

To enable the AI chat functionality, you need to set up a Gemini API key:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an account or sign in
3. Create a new API key
4. Copy the API key
5. Open `utils/constants.ts` in your project
6. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key

```typescript
// Before
export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

// After (example)
export const GEMINI_API_KEY = 'AIzaSyB2Hu4D97zOB8f410cwT2rCc6JnmwoLCAo';
```

## Features

- Real-time chat with Gemini AI
- Context-aware responses about cat breeding
- Persistent chat history
- Typing indicators
- Error handling

## Usage

The AI chatbot will now provide more relevant and accurate responses about cat breeding topics instead of using pre-defined responses.