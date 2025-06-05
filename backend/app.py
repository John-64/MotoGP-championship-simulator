from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

@app.route("/api/riders", methods=["GET"])
def get_riders():
    raw_riders = list(db.riders.find({}, {"_id": 0}))
    riders = []
    print(raw_riders)
    for r in raw_riders:
        riders.append({
            "rider_name": r.get("Name", "Unknown"),
            "rider_first_places": r.get("First Places", 0),
            "rider_second_places": r.get("Second Places", 0),
            "rider_third_places": r.get("Third Places", 0),
            "rider_pole_positions": r.get("Number poles positions", 0),
            "rider_world_championships": r.get("Number World Championships", 0),
        })
    return jsonify(riders)

@app.route("/api/track", methods=["GET"])
def get_track():
    raw_track = list(db.track.find({}))
    track = []
    for r in raw_track:
        track.append({
            "track_name": r.get("Track", "Unknown"),
            "track_country": r.get("Country", "Unknown"),
        })
    return jsonify(track)

@app.route("/api/create_championships", methods=["POST"])
def create_championship():
    data = request.get_json()
    name = data.get("name")
    riders = data.get("riders", [])
    tracks = data.get("tracks", [])

    if not name:
        return jsonify({"error": "Il nome del campionato è obbligatorio."}), 400
    
    if not riders:
        return jsonify({"error": "Devi selezionare almeno un pilota."}), 400
    
    if not tracks:
        return jsonify({"error": "Devi selezionare almeno un circuito."}), 400

    championship = {
        "name": name,
        "created_at": datetime.utcnow(),
        "state": "beginning",
        "riders": riders,
        "tracks": tracks,
        "races": [],
        "standings": []
    }

    result = db.custom_championships.insert_one(championship)
    return jsonify({"message": "Campionato creato!", "id": str(result.inserted_id)})

@app.route("/api/championships", methods=["GET"])
def list_championships():
    ch = db.custom_championships.find()
    response = []
    for c in ch:
        response.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "state": c["state"],
            "created_at": c["created_at"]
        })
    return jsonify(response)

@app.route("/api/championships/<id>", methods=["DELETE"])
def delete_championship(id):
    result = db.custom_championships.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Campionato non trovato."}), 404
    return jsonify({"message": "Campionato eliminato."})

@app.route("/api/championships/<id>", methods=["GET"])
def get_championship(id):
    champ = db.custom_championships.find_one({ "_id": ObjectId(id) })
    if not champ:
        return jsonify({ "error": "Campionato non trovato." }), 404

    champ["_id"] = str(champ["_id"])
    return jsonify(champ)

@app.route("/api/championships/<id>/riders", methods=["POST"])
def add_riders_to_championship(id):
    data = request.get_json()
    new_riders = data.get("riders", [])  # [{"rider_id": "...", "name": "..."}]

    db.custom_championships.update_one(
        { "_id": ObjectId(id) },
        { "$addToSet": { "riders": { "$each": new_riders } } }
    )
    return jsonify({ "message": "Piloti aggiunti." })

@app.route("/api/championships/<id>/riders/<rider_id>", methods=["DELETE"])
def remove_rider(id, rider_id):
    db.custom_championships.update_one(
        { "_id": ObjectId(id) },
        { "$pull": { "riders": { "rider_id": rider_id } } }
    )
    return jsonify({ "message": "Pilota rimosso." })

@app.route("/api/championships/<id>/races", methods=["POST"])
def add_race(id):
    data = request.get_json()
    race = {
        "race_name": data["race_name"],
        "date": data.get("date", str(datetime.utcnow())),
        "results": data.get("results", [])  # [{ rider_id, position }]
    }

    db.custom_championships.update_one(
        { "_id": ObjectId(id) },
        { "$push": { "races": race } }
    )
    return jsonify({ "message": "Gara aggiunta." })

@app.route("/api/championships/<id>/standings", methods=["GET"])
def get_standings(id):
    champ = db.custom_championships.find_one({ "_id": ObjectId(id) })
    if not champ:
        return jsonify({ "error": "Campionato non trovato." }), 404

    points_per_position = {1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8, 9: 7, 10: 6}

    standings = {}
    for race in champ.get("races", []):
        for result in race.get("results", []):
            pid = result["rider_id"]
            pos = result["position"]
            points = points_per_position.get(pos, 0)
            standings[pid] = standings.get(pid, 0) + points

    output = [{"rider_id": k, "points": v} for k, v in sorted(standings.items(), key=lambda x: -x[1])]
    return jsonify(output)


@app.route("/api/championships/<championship_id>/riders", methods=["PATCH"])
def update_championship_riders(championship_id):
    data = request.get_json()
    action = data.get("action")  # 'add' or 'remove'
    rider = data.get("rider")

    if action not in ("add", "remove"):
        return jsonify({"error": "Azione non valida."}), 400

    query = {"_id": ObjectId(championship_id)}
    update = {
        "$addToSet": {"riders": rider} if action == "add" else {"$pull": {"riders": rider}}
    }
    db.custom_championships.update_one(query, update)
    return jsonify({"message": f"Pilota {action}ed correttamente."})

@app.route("/api/races", methods=["POST"])
def add_race_result():
    data = request.get_json()
    race = {
        "championship_id": data["championship_id"],
        "race_name": data["race_name"],
        "date": datetime.utcnow(),
        "results": data["results"]  # lista ordinata di rider_name
    }
    db.custom_races.insert_one(race)

    # Calcolo punti base (25, 20, 16, ...)
    points = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6]
    for i, rider in enumerate(data["results"][:10]):
        db.standings.update_one(
            {"championship_id": data["championship_id"], "rider_name": rider},
            {"$inc": {"points": points[i]}},
            upsert=True
        )
    return jsonify({"message": "Gara aggiunta e classifica aggiornata."})

@app.route("/api/races/<championship_id>/detailed", methods=["GET"])
def get_race_details(championship_id):
    races = list(db.custom_races.find({"championship_id": championship_id}))
    detailed_races = []
    for race in races:
        detailed = []
        for rname in race["results"]:
            rider = db.riders.find_one({"Riders All Time in All Classes": rname}, {"_id": 0})
            if rider:
                detailed.append({"rider_name": rname, "stats": rider})
        detailed_races.append({
            "race_name": race["race_name"],
            "results": detailed
        })
    return jsonify(detailed_races)

if __name__ == "__main__":
    app.run(debug=True)