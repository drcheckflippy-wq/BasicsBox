from flask import Flask, request, jsonify
from googletrans import Translator

app = Flask(__name__)
translator = Translator()

CACHE = {}

@app.route("/translate", methods=["POST"])
def translate_text():
    data = request.get_json(silent=True) or {}
    texts = data.get("texts")        # list of strings
    target = data.get("target", "ta")

    if not texts or not isinstance(texts, list):
        return jsonify({"error": "texts list required"}), 400

    results = []

    for text in texts:
        if not text:
            results.append(text)
            continue

        key = f"{text}:{target}"

        # cache hit
        if key in CACHE:
            results.append(CACHE[key])
            continue

        try:
            translated = translator.translate(text, dest=target).text
        except Exception as e:
            print("Translation error:", e)
            translated = text  # graceful fallback

        CACHE[key] = translated
        results.append(translated)

    return jsonify({"translated": results})


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
        threaded=True  # allow concurrent requests
    )