from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId
from raceSimulator import SimulatoreGara
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

def convert_objectid(obj):
    if isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

@app.route("/api/create_championship", methods=["POST"])
def create_championship():
    data = request.get_json()
    championship_name = data.get("name")
    riders = data.get("riders", [])
    tracks = data.get("tracks", [])
    races = data.get("races", [])
    standing = data.get("standing", [])

    if not championship_name:
        return jsonify({"error": "Il nome del campionato è obbligatorio."}), 400
    if not riders:
        return jsonify({"error": "Devi selezionare almeno un pilota."}), 400
    if not tracks:
        return jsonify({"error": "Devi selezionare almeno un circuito."}), 400

    # Converti ogni rider ID da stringa a ObjectId
    try:
        riders_objectids = [ObjectId(r) for r in riders]
        tracks_objectids = [ObjectId(t) for t in tracks]
    except Exception as e:
        return jsonify({"error": "ObjectID: piloti o tracciati non validi"}), 400

    championship = {
        "name": championship_name,
        "state": "beginning",
        "riders": riders_objectids,   # qui metti la lista di ObjectId
        "tracks": tracks_objectids,
        "races": races,
        "standings": standing
    }

    result = db.championship.insert_one(championship)
    return jsonify({"message": "Campionato creato!", "id": str(result.inserted_id)})

# Championship list
@app.route("/api/championship_list", methods=["GET"])
def list_championships():
    champ = db.championship.find()
    response = []
    for c in champ:
        response.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "state": c.get("state", "beginning")
        })

    return jsonify(response)

# Find championship by id
@app.route("/api/championship/<id>", methods=["GET"])
def get_championship(id):
    champ = db.championship.find_one({"_id": ObjectId(id)})
    if not champ:
        return jsonify({"error": "Campionato non trovato."}), 404

    champ = convert_objectid(champ)
    return jsonify(champ)

# Championship deletion
@app.route("/api/championship/<id>", methods=["DELETE"])
def delete_championship(id):
    result = db.championship.delete_one({"_id": ObjectId(id)})

    if result.deleted_count == 0:
        return jsonify({"error": "Campionato non trovato."}), 404
    
    return jsonify({"message": "Campionato eliminato."})

# Rider list
@app.route("/api/rider", methods=["GET"])
def get_riders():
    raw_riders = list(db.rider.find({}))

    riders = []
    for r in raw_riders:
        riders.append({
            "rider_id": str(r.get("_id")),
            "rider_name": r.get("Name", "Unknown"),
            "rider_first_places": r.get("First Places", 0),
            "rider_second_places": r.get("Second Places", 0),
            "rider_third_places": r.get("Third Places", 0),
            "rider_pole_positions": r.get("PolesPositions", 0),
            "rider_world_championships": r.get("WorldChampionships", 0),
            "rider_country": r.get("Country", "XX"),
            "rider_score": r.get("Score", 0),
            "rider_normalized_score": r.get("NormalizedScore", 0.5),
        })

    return jsonify(riders)

# Join between riders list and riders participants
@app.route("/api/get_participants_riders", methods=["GET"])
def get_participants():
    championship_id = request.args.get("id")

    if not championship_id:
        return jsonify({"error": "ID del campionato mancante"}), 400

    try:
        championship_identifier = ObjectId(championship_id)
    except:
        return jsonify({"error": "ID del campionato non valido"}), 400

    pipeline = [
        {
            "$match": {
                "_id": championship_identifier
            }
        },
        {
            "$lookup": {
                "from": "rider",
                "localField": "riders",
                "foreignField": "_id",
                "as": "riders_participants"
            }
        },
        {
            "$project": {
                "_id": 1,
                "name": 1,
                "riders": {
                    "$map": {
                        "input": "$riders_participants",
                        "as": "r",
                        "in": {
                            "rider_id": {"$toString": "$$r._id"},
                            "rider_name": "$$r.Name",
                            "rider_first_places": "$$r.First Places",
                            "rider_second_places": "$$r.Second Places",
                            "rider_third_places": "$$r.Third Places",
                            "rider_pole_positions": "$$r.PolesPositions",
                            "rider_world_championships": "$$r.WorldChampionships",
                            "rider_country": "$$r.Country",
                            "rider_score": "$$r.Score",
                            "rider_normalized_score": "$$r.NormalizedScore"
                        }
                    }
                }
            }
        }
    ]

    result = list(db.championship.aggregate(pipeline))

    if not result:
        return jsonify({"error": "Campionato non trovato"}), 404

    champ = result[0]

    return jsonify({
        "riders": champ.get("riders", [])
    })

# Track list
@app.route("/api/track", methods=["GET"])
def get_track():
    raw_track = list(db.track.find({}))
    track = []
    for r in raw_track:
        track.append({
            "track_id": str(r.get("_id")),
            "track_name": r.get("Track", "Unknown"),
            "track_country": r.get("Country", "Unknown"),
        })
    return jsonify(track)

# Join between track list and track selected
@app.route("/api/get_selected_tracks", methods=["GET"])
def get_selected_tracks():
    championship_id = request.args.get("id")

    if not championship_id:
        return jsonify({"error": "ID del campionato mancante"}), 400

    try:
        championship_identifier = ObjectId(championship_id)
    except:
        return jsonify({"error": "ID del campionato non valido"}), 400

    pipeline = [
        {
            "$match": {
                "_id": championship_identifier
            }
        },
        {
            "$lookup": {
                "from": "track",              # Nome della collection dei tracciati
                "localField": "tracks",       # Campo nella collection championship
                "foreignField": "_id",        # Campo nella collection track
                "as": "track_participants"
            }
        },
        {
            "$project": {
                "tracks": {
                    "$map": {
                        "input": "$track_participants",
                        "as": "t",
                        "in": {
                            "track_id": {"$toString": "$$t._id"},
                            "track_name": "$$t.Track",
                            "track_country": "$$t.Country"
                        }
                    }
                }
            }
        }
    ]

    result = list(db.championship.aggregate(pipeline))

    if not result:
        return jsonify({"error": "Campionato non trovato"}), 404

    champ = result[0]

    return jsonify({
        "tracks": champ.get("tracks", [])
    })


# Race simulation
@app.route("/api/championship/<championship_id>/simulate-race", methods=["POST"])
def simulate_race(championship_id):
    try:
        data = request.get_json()
        riders = data.get("riders")
        track_name = data.get("track_name")
        num_laps = data.get("num_laps")

        if not riders or not track_name or not num_laps:
            return jsonify({"error": "Parametri mancanti"}), 400

        
        champ = db.championship.find_one({"_id": ObjectId(championship_id)})

        if not champ:
            return jsonify({"error": "Campionato non trovato."}), 404
        
        simulatore = SimulatoreGara(riders, track_name)
        risultati_gara = simulatore.simula_gara_completa(num_laps)
        
        race_data = {
            "championship_id": championship_id,
            "race_name": f"GP {track_name}",
            "track_name": track_name,
            "date": datetime.utcnow(),
            "num_laps": num_laps,
            "detailed_results": risultati_gara["final_results"],
            "race_events": risultati_gara["race_events"],
            "race_stats": risultati_gara["race_stats"]
        }
        
        # Aggiorna il DB con la nuova gara
        db.championship.update_one(
            {"_id": ObjectId(championship_id)},
            {"$push": {"races": race_data}},
        )
        
        current_tracks = champ.get("tracks", [])
        updated_tracks = [t for t in current_tracks if t.get("track_name") != track_name]
        
        champ_status_update = {}
        if not updated_tracks:
            champ_status_update["state"] = "finished"
        elif champ.get("state") == "beginning":
            champ_status_update["state"] = "racing"

        update_set_fields = {"tracks": updated_tracks}
        if champ_status_update:
            update_set_fields.update(champ_status_update)

        db.championship.update_one(
            {"_id": ObjectId(championship_id)},
            {"$set": update_set_fields}
        )

        updated_standings = calculate_championship_standings(championship_id)
        
        db.championship.update_one(
            {"_id": ObjectId(championship_id)},
            {"$set": {"standings": updated_standings}}
        )
        
        # --- Qui aggiungiamo i riders da restituire nella risposta ---
        return jsonify({
            "message": "Gara simulata con successo usando ML!",
            "race_results": risultati_gara,
            "updated_standings": updated_standings,
            "riders": piloti_per_simulazione  # <-- lista piloti da passare al frontend
        })
        
    except Exception as e:
        print(f"Errore nella simulazione della gara: {e}")
        return jsonify({"error": f"Errore durante la simulazione: {str(e)}"}), 500


# Calculate standing
def calculate_standing(championship_id):
    champ = db.championship.find_one({"_id": ObjectId(championship_id)})

    if not champ:
        return []
    
    rider_points = {}
    rider_info = {}
    
    for race in champ.get("race", []):
        detailed_results = race.get("detailed_results", [])
        
        for result in detailed_results:
            rider_name = result["rider_name"]
            points = result.get("points", 0)
            
            if rider_name not in rider_points:
                rider_points[rider_name] = 0
                rider_info[rider_name] = {
                    "rider_country": result.get("rider_country", "XX"),
                    "races_finished": 0,
                    "races_retired": 0,
                    "wins": 0,
                    "podiums": 0
                }
            
            rider_points[rider_name] += points
            
            race_num_laps = race.get("num_laps", 0)
            
            if not result.get("retired", False) and result.get("completed_laps", 0) == race_num_laps:
                rider_info[rider_name]["races_finished"] += 1
                if result.get("position") == 1:
                    rider_info[rider_name]["wins"] += 1
                if result.get("position") <= 3:
                    rider_info[rider_name]["podiums"] += 1
            else:
                rider_info[rider_name]["races_retired"] += 1
    
    standings = []
    for rider_name, total_points in sorted(rider_points.items(), key=lambda x: x[1], reverse=True):
        standings.append({
            "position": len(standings) + 1,
            "rider_name": rider_name,
            "rider_country": rider_info[rider_name]["rider_country"],
            "total_points": total_points,
            "races_finished": rider_info[rider_name]["races_finished"],
            "races_retired": rider_info[rider_name]["races_retired"],
            "wins": rider_info[rider_name]["wins"],
            "podiums": rider_info[rider_name]["podiums"]
        })
    
    return standings

@app.route("/api/championships/<championship_id>/standings", methods=["GET"])
def get_standings(championship_id):
    try:
        champ = db.championship.find_one({"_id": ObjectId(championship_id)})
        if not champ:
            return jsonify({"error": "Campionato non trovato."}), 404
        
        return jsonify(champ.get("standings", []))
        
    except Exception as e:
        return jsonify({"error": f"Errore nel recupero della classifica: {str(e)}"}), 500


@app.route("/api/championships/<championship_id>/standings/recalculate", methods=["POST"])
def recalculate_standings(championship_id):
    try:
        champ = db.championship.find_one({"_id": ObjectId(championship_id)})
        if not champ:
            return jsonify({"error": "Campionato non trovato."}), 404
        
        updated_standings = calculate_championship_standings(championship_id)
        
        db.championship.update_one(
            {"_id": ObjectId(championship_id)},
            {"$set": {"standings": updated_standings}}
        )
        
        return jsonify({
            "message": "Classifica ricalcolata con successo!",
            "standings": updated_standings
        })
        
    except Exception as e:
        return jsonify({"error": f"Errore nel ricalcolo della classifica: {str(e)}"}), 500
    
if __name__ == "__main__":
    app.run(debug=True)