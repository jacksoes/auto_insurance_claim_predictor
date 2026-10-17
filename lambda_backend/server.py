import json
from flask import Flask, jsonify
from flask_cors import CORS

from lambda_function import lambda_handler

app = Flask(__name__)
CORS(app)

@app.get("/api/claims/summary")
def claims_summary():
    result = lambda_handler(None, None)
    body = json.loads(result["body"])

    if result["statusCode"] != 200:
        return jsonify(body), result["statusCode"]

    return jsonify(body)

if __name__ == "__main__":
    app.run(port=5000, debug=True)