from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from raceSimulator import SimulatoreGara
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

# Function for converting ObjectId to string
def convert_objectid(obj):
    if isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj


# Create championship
@app.route("/api/create_championship", methods=["POST"])
def create_championship():
    data = request.get_json()
    championship_name = data.get("name")
    riders = data.get("riders", [])
    tracks = data.get("tracks", [])
    races = data.get("races", [])

    if not championship_name:
        return jsonify({"error": "Il nome del campionato è obbligatorio."}), 400
    if not riders:
        return jsonify({"error": "Devi selezionare almeno un pilota."}), 400
    if not tracks:
        return jsonify({"error": "Devi selezionare almeno un circuito."}), 400

    try:
        riders_objectids = [ObjectId(r) for r in riders]
        tracks_objectids = [ObjectId(t) for t in tracks]
    except Exception as e:
        return jsonify({"error": "ObjectID: piloti o tracciati non validi"}), 400

    championship = {
        "name": championship_name,
        "riders": riders_objectids,
        "tracks": tracks_objectids,
        "races": races
    }

    result = db.championship.insert_one(championship)
    return jsonify({"message": "Campionato creato!", "id": str(result.inserted_id)})


# Championship list
@app.route("/api/championship_list", methods=["GET"])
def list_championships():
    champ = db.championship.find()
    response = []
    for c in champ:
        riders = c.get("riders", [])
        tracks = c.get("tracks", [])
        races = c.get("races", [])
        
        response.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "riders": convert_objectid(riders),
            "tracks": convert_objectid(tracks),
            "races": convert_objectid(races)
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


# Championship update
@app.route("/api/championship/<id>", methods=["PUT"])
def update_championship(id):
    data = request.get_json()

    try:
        championship_object_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "ID non valido."}), 400

    # Recupera il campionato
    campionato = db.championship.find_one({"_id": championship_object_id})
    if not campionato:
        return jsonify({"error": "Campionato non trovato."}), 404

    # Aggiorna nome se fornito
    if "name" in data:
        db.championship.update_one(
            {"_id": championship_object_id},
            {"$set": {"name": data["name"]}}
        )

    # Elimina gare selezionate
    if "races" in data:
        try:
            race_ids_to_delete = [ObjectId(rid) for rid in data["races"]]
        except Exception:
            return jsonify({"error": "Lista di ID gare non valida."}), 400

        delete_result = db.race.delete_many({
            "_id": {"$in": race_ids_to_delete},
            "championship_id": championship_object_id
        })

        # Rimuovi anche gli ID dal campo "races" del campionato, se presente
        db.championship.update_one(
            {"_id": championship_object_id},
            {"$pull": {"races": {"$in": race_ids_to_delete}}}
        )

    return jsonify({"message": "Campionato aggiornato e gare eliminate con successo."})



# Championship deletion
@app.route("/api/championship/<id>", methods=["DELETE"])
def delete_championship(id):
    try:
        championship_object_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "ID non valido."}), 400

    # Elimina il campionato
    result = db.championship.delete_one({"_id": championship_object_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Campionato non trovato."}), 404

    # Elimina tutte le gare associate
    deleted_races = db.race.delete_many({"championship_id": championship_object_id})

    return jsonify({
        "message": "Campionato e relative gare eliminati.",
        "deleted_races_count": deleted_races.deleted_count
    })



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
                "from": "track",
                "localField": "tracks",
                "foreignField": "_id",
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


# Race creation
@app.route("/api/create_race", methods=["POST"])
def create_race():
    try:
        data = request.get_json()

        championship_id = data.get("championship_id")
        track_name = data.get("track_name")
        num_laps = data.get("num_laps")
        race_results = data.get("race_results")

        if not all([championship_id, track_name, num_laps, race_results]):
            return jsonify({"error": "Parametri mancanti."}), 400

        race_doc = {
            "championship_id": ObjectId(championship_id),
            "track_name": track_name,
            "num_laps": num_laps,
            "results": race_results
        }

        inserted = db.race.insert_one(race_doc)
        race_id = inserted.inserted_id

        # Collega la gara al campionato
        db.championship.update_one(
            {"_id": ObjectId(championship_id)},
            {"$push": {"races": race_id}}
        )

        return jsonify({"message": "Gara creata con successo", "race_id": str(race_id)})

    except Exception as e:
        print(f"Errore durante la creazione della gara: {e}")
        return jsonify({"error": f"Errore durante la creazione della gara: {str(e)}"}), 500


# Selecting all the races with the championship id
@app.route("/api/get_races_championship", methods=["GET"])
def get_races_championship():
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
                "championship_id": championship_identifier
            }
        }
    ]

    result = list(db.race.aggregate(pipeline))
    if not result:
        return jsonify({"error": "Campionato non trovato"}), 404

    # Converte ObjectId in stringa
    result_serialized = convert_objectid(result)

    return jsonify({
        "races": result_serialized
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

        race_doc = {
            "championship_id": ObjectId(championship_id),
            "track_name": track_name,
            "num_laps": num_laps,
            "results": risultati_gara
        }

        inserted = db.race.insert_one(race_doc)
        race_id = inserted.inserted_id

        db.championship.update_one(
            {"_id": ObjectId(championship_id)},
            {"$push": {"races": race_id}}
        )

        return jsonify({
            "message": "Gara simulata e salvata con successo!",
            "race_id": str(race_id),
            "race_results": risultati_gara
        })
        
    except Exception as e:
        print(f"Errore nella simulazione della gara: {e}")
        return jsonify({"error": f"Errore durante la simulazione: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)