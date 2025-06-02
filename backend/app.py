from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "MotoGP API server attivo"}), 200

@app.route("/api/riders", methods=["GET"])
def get_riders():
    riders = list(db["riders"].find({}, {"_id": 0}))
    return jsonify(riders)

@app.route("/api/races", methods=["GET"])
def get_races():
    races = list(db["races"].find({}, {"_id": 0}))
    return jsonify(races)

if __name__ == "__main__":
    app.run(debug=True)
