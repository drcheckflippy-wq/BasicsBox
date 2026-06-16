# Translator Service - Flask Translation API

Welcome to the Translator Service! This is a lightweight **Flask-based microservice** that provides real-time text translation capabilities using Google Translate API. It's designed to support multi-language translation across the entire e-commerce platform.

---

## 📋 Project Overview

The Translator Service provides:
- **Multi-language Translation** - Translate text to 100+ languages
- **Batch Translation** - Process multiple texts in one request
- **Caching System** - Cache translations to reduce API calls and improve performance
- **Fast & Lightweight** - Minimal dependencies, quick response times
- **RESTful API** - Simple JSON-based API

**Current Supported Languages:**
- English, Spanish, French, German, Italian, Portuguese, Hindi, Tamil, Telugu, Kannada, Malayalam, Chinese, Japanese, Korean, and 100+ more languages

---

## 📁 Folder Structure

```
translator_service/
├── app.py                       # Main Flask application
├── requirements.txt             # Python dependencies (if exists)
└── README.md                    # This file
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `app.py` | Main Flask application with translation endpoints and caching logic |

---

## 🛠️ Prerequisites & Requirements

Before you start, make sure you have:

1. **Python 3.7+** installed ([Download Python](https://www.python.org/downloads/))
   - Verify: `python --version`
   
2. **pip** (Python package manager - comes with Python)
   - Verify: `pip --version`

3. **Git** installed (optional, for cloning repo)
   - Verify: `git --version`

4. **Text Editor/IDE** (VS Code, PyCharm, Sublime Text, etc.)

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Navigate to the Translator Service Directory

```bash
cd e:\Ecommerce\translator_service
```

### Step 2: Create a Virtual Environment

A virtual environment keeps project dependencies isolated from your system Python.

```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

**Activate the virtual environment:**

```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt.

### Step 3: Install Python Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install Flask
pip install Flask

# Install Google Translate library
pip install googletrans==4.0.0

# Optional: For production deployment
pip install gunicorn
pip install python-dotenv
```

**Or install all at once:**

```bash
pip install Flask googletrans==4.0.0 gunicorn python-dotenv
```

### Step 4: Verify Installation

```bash
# Check Python packages
pip list

# You should see:
# Flask
# googletrans
# gunicorn (if installed)
```

### Step 5: Test the Application Locally

```bash
# Run the Flask development server
python app.py
```

**Success output:**
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

---

## ▶️ Running the Service

### Development Server (Testing & Development)

```bash
# Make sure virtual environment is activated
python app.py

# Server will start at http://localhost:5000
```

### Production Server (Using Gunicorn)

```bash
# Using Gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Parameters explained:
# -w 4          : 4 worker processes
# -b 0.0.0.0:5000 : Bind to all interfaces on port 5000
# app:app       : Flask app instance
```

---

## 📡 API Endpoints

### Endpoint: `/translate`

**Method:** `POST`

**Description:** Translate one or multiple texts to target language

**Request Example:**

```bash
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Good morning", "How are you?"],
    "target": "ta"
  }'
```

**Request Body:**

```json
{
  "texts": ["Hello", "Good morning"],
  "target": "ta"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `texts` | Array | Yes | Array of text strings to translate |
| `target` | String | Yes | Target language code (e.g., 'ta', 'hi', 'es', 'fr') |

**Response (Success):**

```json
{
  "translations": [
    "வணக்கம்",
    "காலை வணக்கம்"
  ],
  "target_language": "ta",
  "status": "success"
}
```

**Response (Error):**

```json
{
  "error": "texts list required",
  "status": "error"
}
```

---

## 🌍 Language Codes

Common language codes you can use with the `target` parameter:

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | en | Tamil | ta |
| Spanish | es | Telugu | te |
| French | fr | Kannada | kn |
| German | de | Malayalam | ml |
| Italian | it | Hindi | hi |
| Portuguese | pt | Chinese | zh-CN |
| Russian | ru | Japanese | ja |
| Korean | ko | Marathi | mr |
| Arabic | ar | Gujarati | gu |
| Dutch | nl | Bengali | bn |

**Full list:** https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

---

## 💾 Caching System

The service includes a built-in **cache system** to improve performance:

```python
CACHE = {}  # Stores translated text with format: "text:target_lang" -> "translation"
```

### How Caching Works:

1. When a translation request comes in, the service checks if it's already in cache
2. If found (cache hit), returns immediately from cache (very fast)
3. If not found (cache miss), translates using Google Translate
4. Stores the result in cache for future requests

### Benefits:
- ✅ Reduces API calls to Google Translate
- ✅ Faster response times for repeated translations
- ✅ Lower latency for users
- ✅ Better performance under load

---

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file in the `translator_service/` directory:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_APP=app.py

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

### Load Environment Variables

```python
# In app.py (if not already done)
from dotenv import load_dotenv
import os

load_dotenv()

PORT = os.getenv('PORT', 5000)
DEBUG = os.getenv('FLASK_DEBUG', True)
```

---

## 🧪 Testing the API

### Using cURL (Command Line)

```bash
# Single text translation
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Hello"], "target": "ta"}'

# Multiple texts
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Hello", "Good morning", "Goodbye"], "target": "hi"}'
```

### Using Python

```python
import requests

url = "http://localhost:5000/translate"
data = {
    "texts": ["Hello", "Good morning"],
    "target": "ta"
}

response = requests.post(url, json=data)
print(response.json())
```

### Using JavaScript/Fetch

```javascript
fetch('http://localhost:5000/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    texts: ['Hello', 'Good morning'],
    target: 'ta'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Using Postman

1. Open Postman
2. Create new POST request
3. URL: `http://localhost:5000/translate`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "texts": ["Hello", "Good morning"],
  "target": "ta"
}
```
6. Click "Send"

---

## 📦 Python Dependencies Explained

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | Latest | Web framework for API |
| googletrans | 4.0.0 | Google Translate API wrapper |
| gunicorn | Latest | Production WSGI server |
| python-dotenv | Latest | Load environment variables |

---

## ⚠️ Common Issues & Troubleshooting

### Issue 1: ModuleNotFoundError
```
Error: ModuleNotFoundError: No module named 'flask'
```
**Solution:**
```bash
# Ensure virtual environment is activated
# Reinstall Flask
pip install Flask
```

### Issue 2: Port Already in Use
```
Error: OSError: [Errno 48] Address already in use
```
**Solution:**
```bash
# Use a different port
python app.py  # Change port in app.py
# Or kill the process using port 5000
```

### Issue 3: Google Translate Not Working
```
Error: Connection refused or googletrans error
```
**Solution:**
- Check internet connection
- Google Translate may have rate limits
- Try again after a few seconds
- Update googletrans: `pip install --upgrade googletrans==4.0.0`

### Issue 4: Invalid Language Code
```json
{"error": "Invalid target language"}
```
**Solution:**
- Use valid ISO 639-1 language codes
- Check language codes list above
- Common codes: ta, hi, es, fr, de, etc.

### Issue 5: Empty or Null Texts
```json
{"error": "texts list required"}
```
**Solution:**
```json
// Correct
{"texts": ["Hello", "World"], "target": "ta"}

// Incorrect - missing texts
{"target": "ta"}

// Incorrect - texts not a list
{"texts": "Hello", "target": "ta"}
```

---

## 🔌 Integration with Other Services

### Backend Integration

```python
# In Django backend (api/utils.py)
import requests

TRANSLATOR_URL = "http://localhost:5000/translate"

def translate_text(text, target_lang="ta"):
    response = requests.post(TRANSLATOR_URL, json={
        "texts": [text],
        "target": target_lang
    })
    return response.json()["translations"][0]

# Usage
translated = translate_text("Hello", "ta")
```

### Frontend Integration

```javascript
// In React/Vite frontend
const translateText = async (texts, targetLang) => {
  const response = await fetch('http://localhost:5000/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts: texts,
      target: targetLang
    })
  });
  return response.json();
};
```

### Mobile App Integration

```javascript
// In React Native (Customer/Merchant app)
const translateText = async (texts, targetLang) => {
  try {
    const response = await axios.post('http://localhost:5000/translate', {
      texts: texts,
      target: targetLang
    });
    return response.data.translations;
  } catch (error) {
    console.error('Translation error:', error);
  }
};
```

---

## 🚀 Deployment

### Deploy to Heroku

```bash
# Create Procfile in translator_service/
echo "web: gunicorn -w 4 -b 0.0.0.0:\$PORT app:app" > Procfile

# Create requirements.txt
pip freeze > requirements.txt

# Deploy
git push heroku main
```

### Deploy to PythonAnywhere

1. Upload files to PythonAnywhere
2. Create web app with Flask
3. Set WSGI file path
4. Reload web app

### Deploy to Railway.app

```bash
# Connect GitHub repo
# Railway automatically detects Python app
# Set PORT environment variable
# Deploy
```

---

## 📊 Performance Tips

1. **Use Caching:** Let the built-in cache reduce translation API calls
2. **Batch Requests:** Send multiple texts in one request instead of many requests
3. **Use Persistent Storage:** Consider Redis for persistent caching in production
4. **Rate Limiting:** Implement rate limiting to prevent abuse
5. **CDN:** Use CDN for static assets if serving frontend from here

---

## 🔒 Security Considerations

1. **Input Validation:** Always validate incoming text
2. **Rate Limiting:** Add rate limiting to prevent DDoS
3. **CORS:** Configure CORS properly for cross-origin requests
4. **API Keys:** Don't expose API keys in code
5. **HTTPS:** Use HTTPS in production
6. **Error Handling:** Don't expose sensitive error details

---

## 📝 Code Walkthrough

```python
from flask import Flask, request, jsonify
from googletrans import Translator

app = Flask(__name__)
translator = Translator()
CACHE = {}  # In-memory cache

@app.route("/translate", methods=["POST"])
def translate_text():
    # Get JSON data from request
    data = request.get_json(silent=True) or {}
    texts = data.get("texts")          # List of texts to translate
    target = data.get("target", "ta")  # Target language (default: Tamil)

    # Validate input
    if not texts or not isinstance(texts, list):
        return jsonify({"error": "texts list required"}), 400

    results = []

    for text in texts:
        if not text:
            results.append(text)
            continue

        # Check cache first
        cache_key = f"{text}:{target}"
        if cache_key in CACHE:
            results.append(CACHE[cache_key])
            continue

        # Translate and cache
        translated = translator.translate(text, src_language='auto', dest_language=target)
        translation = translated['text']
        CACHE[cache_key] = translation
        results.append(translation)

    return jsonify({"translations": results, "target_language": target})

if __name__ == "__main__":
    app.run(debug=True)
```

---

## 🆘 Support & Documentation

- **Flask Docs:** https://flask.palletsprojects.com/
- **googletrans:** https://github.com/ssut/py-googletrans
- **Gunicorn Docs:** https://gunicorn.org/
- **ISO 639-1 Language Codes:** https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

---

## ✅ Pre-Deployment Checklist

- [ ] Test all endpoints locally
- [ ] Verify caching is working
- [ ] Test with various languages
- [ ] Test error handling
- [ ] Set DEBUG=False in production
- [ ] Configure CORS for production domains
- [ ] Set up logging
- [ ] Test with load/multiple requests
- [ ] Set up monitoring/alerts
- [ ] Document API in Postman/Swagger

---

**Ready to translate! 🌐**

Happy coding! For any issues, check the troubleshooting section or consult the official documentation.
