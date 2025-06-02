from flask import Blueprint, jsonify
from models.db import db

riders_bp = Blueprint("riders", __name__)

@riders_bp.route("/", methods=["GET"])
def get_riders():
    riders = list(db["riders"].find({}, {"_id": 0}))
    return jsonify(riders)
