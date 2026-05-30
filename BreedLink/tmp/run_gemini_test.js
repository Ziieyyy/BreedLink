const fetch = globalThis.fetch || require('node-fetch');

const GEMINI_API_KEY = 'AIzaSyDll-orwv6R6eiTlMb6g5ZziOOUIuwbtaM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-flash-preview-05-20:generateText';

(async () => {
  try {
    console.log('Posting to generateContent endpoint for gemini-2.5-flash...');
    const body = {
      contents: [{ parts: [{ text: `Say hello briefly.` }] }]
    };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response preview:', text.slice(0, 1000));
  } catch (err) {
    console.error('Request error:', err);
  }
})();
