from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId
import random
from dataclasses import dataclass
from typing import List, Optional, Dict
import os
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import pandas as pd

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

@dataclass
class PilotaGara:
    rider_name: str
    rider_country: str
    normalized_score: float
    posizione: int = 0
    giri_completati: int = 0
    tempo_totale: float = 0.0
    ritirato: bool = False
    motivo_ritiro: Optional[str] = None
    tempo_ultimo_giro: float = 0.0
    penalita_tempo_giro_corrente: float = 0.0
    # Nuovi attributi per ML
    consistency_score: float = 0.3  # Quanto è consistente il pilota
    pressure_resistance: float = 0.4  # Resistenza alla pressione
    fatigue_factor: float = 0.6  # Fattore fatica
    risk_profile: float = 0.2  # Profilo di rischio (0=conservativo, 1=aggressivo)

class MLRacePredictor:
    """Classe per le predizioni ML nella gara"""
    
    def __init__(self):
        self.lap_time_model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.incident_model = RandomForestRegressor(n_estimators=30, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_synthetic_training_data(self, n_samples=1000):
        """Genera dati sintetici per allenare i modelli"""
        # Genera features sintetiche basate sui piloti
        data = []
        for _ in range(n_samples):
            # Features del pilota
            normalized_score = random.uniform(0.1, 1.0)
            consistency = random.uniform(0.2, 0.9)
            pressure_resistance = random.uniform(0.2, 0.9)
            fatigue_factor = random.uniform(0.3, 0.8)
            
            # Features della gara
            current_lap = random.randint(1, 25)
            total_laps = random.randint(15, 30)
            position = random.randint(1, 20)
            total_riders = random.randint(12, 24)
            
            # Features ambientali
            race_progress = current_lap / total_laps
            is_final_phase = 1 if race_progress > 0.75 else 0
            relative_position = position / total_riders
            
            # Target: tempo giro (correlato alle features)
            base_time = 90 - (normalized_score * 10)  # Piloti migliori hanno tempi base più bassi
            consistency_var = (1 - consistency) * 3  # Meno consistenza = più variazione
            pressure_effect = (1 - pressure_resistance) * race_progress * 2
            fatigue_effect = fatigue_factor * race_progress * 1.5
            
            lap_time = base_time + random.gauss(0, consistency_var) + pressure_effect + fatigue_effect
            lap_time = max(80, min(110, lap_time))  # Clamp ai limiti realistici
            
            # Target: probabilità incidente
            base_incident_prob = (1 - normalized_score) * 0.02
            pressure_incident = is_final_phase * (1 - pressure_resistance) * 0.01
            fatigue_incident = race_progress * (1 - fatigue_factor) * 0.005
            
            incident_prob = base_incident_prob + pressure_incident + fatigue_incident
            incident_prob = max(0, min(0.05, incident_prob))
            
            data.append([
                normalized_score, consistency, pressure_resistance, fatigue_factor,
                current_lap, total_laps, race_progress, is_final_phase,
                position, total_riders, relative_position,
                lap_time, incident_prob
            ])
        
        df = pd.DataFrame(data, columns=[
            'normalized_score', 'consistency', 'pressure_resistance', 'fatigue_factor',
            'current_lap', 'total_laps', 'race_progress', 'is_final_phase',
            'position', 'total_riders', 'relative_position',
            'lap_time', 'incident_prob'
        ])
        
        return df
    
    def train_models(self):
        """Allena i modelli ML con dati sintetici"""
        df = self.generate_synthetic_training_data()
        
        # Features per entrambi i modelli
        feature_cols = [
            'normalized_score', 'consistency', 'pressure_resistance', 'fatigue_factor',
            'current_lap', 'total_laps', 'race_progress', 'is_final_phase',
            'position', 'total_riders', 'relative_position'
        ]
        
        X = df[feature_cols].values
        X_scaled = self.scaler.fit_transform(X)
        
        # Allena modello tempo giro
        y_laptime = df['lap_time'].values
        self.lap_time_model.fit(X_scaled, y_laptime)
        
        # Allena modello incidenti
        y_incident = df['incident_prob'].values
        self.incident_model.fit(X_scaled, y_incident)
        
        self.is_trained = True
        print("Modelli ML allenati con successo!")
    
    def predict_lap_time(self, pilota: PilotaGara, current_lap: int, total_laps: int, 
                        current_position: int, total_riders: int) -> float:
        """Predice il tempo giro usando ML"""
        if not self.is_trained:
            self.train_models()
        
        race_progress = current_lap / total_laps
        is_final_phase = 1 if race_progress > 0.75 else 0
        relative_position = current_position / total_riders
        
        features = np.array([[
            pilota.normalized_score, pilota.consistency_score, 
            pilota.pressure_resistance, pilota.fatigue_factor,
            current_lap, total_laps, race_progress, is_final_phase,
            current_position, total_riders, relative_position
        ]])
        
        features_scaled = self.scaler.transform(features)
        predicted_time = self.lap_time_model.predict(features_scaled)[0]
        
        # Aggiungi un po' di rumore casuale per varietà
        noise = random.gauss(0, 0.5)
        return max(80, predicted_time + noise)
    
    def predict_incident_probability(self, pilota: PilotaGara, current_lap: int, 
                                   total_laps: int, current_position: int, 
                                   total_riders: int) -> float:
        """Predice la probabilità di incidente usando ML"""
        if not self.is_trained:
            self.train_models()
        
        race_progress = current_lap / total_laps
        is_final_phase = 1 if race_progress > 0.75 else 0
        relative_position = current_position / total_riders
        
        features = np.array([[
            pilota.normalized_score, pilota.consistency_score,
            pilota.pressure_resistance, pilota.fatigue_factor,
            current_lap, total_laps, race_progress, is_final_phase,
            current_position, total_riders, relative_position
        ]])
        
        features_scaled = self.scaler.transform(features)
        return self.incident_model.predict(features_scaled)[0]

class SimulatoreGara:
    def __init__(self, piloti_data, track_name="Circuito Generico"):
        self.piloti: List[PilotaGara] = []
        self.track_name = track_name
        self.giri_totali = 0
        self.giro_attuale = 0
        self.ml_predictor = MLRacePredictor()
        
        # Cluster i piloti per assegnare caratteristiche
        self.assign_rider_characteristics(piloti_data)
        
        for i, pilota in enumerate(piloti_data):
            p = PilotaGara(
                rider_name=pilota["rider_name"],
                rider_country=pilota["rider_country"],
                normalized_score=pilota.get("normalized_score", 0.5),
                consistency_score=pilota.get("consistency_score", 0.5),
                pressure_resistance=pilota.get("pressure_resistance", 0.5),
                fatigue_factor=pilota.get("fatigue_factor", 0.5),
                risk_profile=pilota.get("risk_profile", 0.5)
            )
            self.piloti.append(p)
    
    def assign_rider_characteristics(self, piloti_data):
        """Usa K-means per assegnare caratteristiche ai piloti"""
        if len(piloti_data) < 3:
            # Se troppo pochi piloti, assegna caratteristiche casuali
            for pilota in piloti_data:
                pilota["consistency_score"] = random.uniform(0.3, 0.8)
                pilota["pressure_resistance"] = random.uniform(0.3, 0.8)
                pilota["fatigue_factor"] = random.uniform(0.4, 0.7)
                pilota["risk_profile"] = random.uniform(0.3, 0.8)
            return
        
        # Estrai features per clustering
        features = []
        for pilota in piloti_data:
            score = pilota.get("normalized_score", 0.5)
            # Simula altre caratteristiche basate sul punteggio + rumore
            features.append([
                score,
                score + random.gauss(0, 0.1),  # Consistency correlata al punteggio
                score + random.gauss(0, 0.15), # Pressure resistance
                0.6 - score * 0.2 + random.gauss(0, 0.1)  # Fatigue (piloti migliori si stancano meno)
            ])
        
        # Cluster in 3 gruppi: conservativi, bilanciati, aggressivi
        n_clusters = min(3, len(piloti_data))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(features)
        
        # Assegna caratteristiche basate sui cluster
        for i, pilota in enumerate(piloti_data):
            cluster = clusters[i]
            base_score = pilota.get("normalized_score", 0.5)
            
            if cluster == 0:  # Cluster conservativo
                pilota["consistency_score"] = min(0.9, base_score + random.uniform(0.1, 0.2))
                pilota["pressure_resistance"] = min(0.9, base_score + random.uniform(0.05, 0.15))
                pilota["fatigue_factor"] = max(0.3, base_score - random.uniform(0.1, 0.2))
                pilota["risk_profile"] = random.uniform(0.2, 0.4)
            elif cluster == 1:  # Cluster bilanciato
                pilota["consistency_score"] = base_score + random.uniform(-0.1, 0.1)
                pilota["pressure_resistance"] = base_score + random.uniform(-0.1, 0.1)
                pilota["fatigue_factor"] = 0.6 + random.uniform(-0.15, 0.15)
                pilota["risk_profile"] = random.uniform(0.4, 0.7)
            else:  # Cluster aggressivo
                pilota["consistency_score"] = max(0.2, base_score - random.uniform(0.1, 0.2))
                pilota["pressure_resistance"] = max(0.3, base_score - random.uniform(0.05, 0.15))
                pilota["fatigue_factor"] = min(0.8, base_score + random.uniform(0.1, 0.2))
                pilota["risk_profile"] = random.uniform(0.6, 0.9)
    
    def inizializza_griglia(self):
        """Crea griglia di partenza con più casualità"""
        self.piloti.sort(key=lambda p: p.normalized_score + random.uniform(-0.15, 0.15), reverse=True)
        
        for i, pilota in enumerate(self.piloti):
            pilota.posizione = i + 1
    
    def calcola_tempo_giro_ml(self, pilota: PilotaGara) -> float:
        """Calcola tempo giro con ML + bonus giornata + rumore casuale"""
        base_time = self.ml_predictor.predict_lap_time(
            pilota,
            self.giro_attuale,
            self.giri_totali,
            pilota.posizione,
            len(self.piloti)
        )
        
        # Applichiamo il bonus giornata (riduce o aumenta il tempo)
        base_time *= (1 - pilota.bonus_giornata)
        
        # Aggiungiamo rumore casuale +/- 2%
        noise_factor = random.uniform(0.98, 1.02)
        base_time *= noise_factor
        
        # Limitiamo tempo minimo (esempio 60s)
        base_time = max(base_time, 60.0)
        
        return base_time
    
    def controlla_incidenti_ml(self, pilota: PilotaGara) -> bool:
        """Gestisce incidenti usando ML"""
        if pilota.ritirato:
            return False
        
        # Usa ML per predire probabilità incidente
        incident_prob = self.ml_predictor.predict_incident_probability(
            pilota, self.giro_attuale, self.giri_totali,
            pilota.posizione, len(self.piloti)
        )
        
        # Modifica probabilità basata sul profilo di rischio
        risk_multiplier = 0.5 + pilota.risk_profile  # 0.5x a 1.5x
        incident_prob *= risk_multiplier
        
        if random.random() < incident_prob:
            problemi = [
                ("Caduta", 0.45),
                ("Problema tecnico", 0.25),
                ("Foratura", 0.20),
                ("Problema motore", 0.10)
            ]
            
            rand = random.random()
            cum_prob = 0
            for problema, prob in problemi:
                cum_prob += prob
                if rand <= cum_prob:
                    pilota.ritirato = True
                    pilota.motivo_ritiro = problema
                    return True
        
        return False
    
    def aggiorna_posizioni(self):
        """Aggiorna classifica basata su giri e tempi"""
        piloti_attivi = [p for p in self.piloti if not p.ritirato]
        piloti_attivi.sort(key=lambda p: (-p.giri_completati, p.tempo_totale))
        
        for i, pilota in enumerate(piloti_attivi):
            pilota.posizione = i + 1
        
        piloti_ritirati = [p for p in self.piloti if p.ritirato]
        piloti_ritirati.sort(key=lambda p: -p.giri_completati)
        for i, pilota in enumerate(piloti_ritirati):
            pilota.posizione = len(piloti_attivi) + i + 1
    
    def simula_giro(self):
        """Simula un singolo giro con ML - VERSIONE CORRETTA"""
        eventi_giro = []
        
        # Salva le posizioni PRIMA del giro per identificare sorpassi
        posizioni_precedenti = {p.rider_name: p.posizione for p in self.piloti}
        
        # Simula il giro per ogni pilota
        random.shuffle(self.piloti)  # Casualità nell'ordine di elaborazione
        
        for pilota in self.piloti:
            if pilota.ritirato:
                continue
            
            # Controlla incidenti prima di calcolare il tempo
            if self.controlla_incidenti_ml(pilota):
                eventi_giro.append({
                    "tipo": "ritiro",
                    "pilota": pilota.rider_name,
                    "motivo": pilota.motivo_ritiro,
                    "giro": self.giro_attuale
                })
                continue
            
            # Calcola tempo giro
            tempo_giro = self.calcola_tempo_giro_ml(pilota)
            
            # Bonus casuale per imprevedibilità
            bonus = random.uniform(-0.5, 0.5)
            tempo_giro += bonus
            
            pilota.tempo_totale += tempo_giro
            pilota.giri_completati += 1
            
            # Gestione penalità (se presente)
            if pilota.penalita_tempo_giro_corrente > 0:
                eventi_giro.append({
                    "tipo": "errore_lieve",
                    "pilota": pilota.rider_name,
                    "motivo": f"Tempo perso: {round(pilota.penalita_tempo_giro_corrente, 2)}s",
                    "giro": self.giro_attuale
                })
                pilota.penalita_tempo_giro_corrente = 0  # Reset penalità
        
        # IMPORTANTE: Aggiorna posizioni DOPO aver simulato tutti i piloti
        self.aggiorna_posizioni()
        
        # Ora controlla i sorpassi confrontando posizioni prima/dopo
        for pilota in self.piloti:
            if pilota.ritirato:
                continue
                
            pos_precedente = posizioni_precedenti.get(pilota.rider_name)
            pos_attuale = pilota.posizione
            
            # Se la posizione è migliorata (numero più basso = posizione migliore)
            if pos_precedente is not None and pos_attuale < pos_precedente:
                posizioni_guadagnate = pos_precedente - pos_attuale
                eventi_giro.append({
                    "tipo": "sorpasso",
                    "pilota": pilota.rider_name,
                    "motivo": f"Sale dalla {pos_precedente}ª alla {pos_attuale}ª posizione (+{posizioni_guadagnate})",
                    "giro": self.giro_attuale
                })
        
        return eventi_giro
    
    def simula_gara_completa(self, num_giri: int = 20):
        """Simula gara completa con ML, con sorpassi e imprevedibilità"""
        self.giri_totali = num_giri
        self.inizializza_griglia()
        
        # Allena i modelli ML se non già fatto
        if not self.ml_predictor.is_trained:
            self.ml_predictor.train_models()
        
        # Assegna bonus/malus giornata a ogni pilota
        for pilota in self.piloti:
            pilota.bonus_giornata = random.uniform(-0.05, 0.05)
        
        griglia_partenza = [{"rider_name": p.rider_name, "position": p.posizione} for p in self.piloti]
        
        eventi_gara = []
        
        # Simula ogni giro
        for giro in range(1, num_giri + 1):
            self.giro_attuale = giro
            eventi_giro = self.simula_giro()
            
            # Aggiungi tutti gli eventi del giro alla lista generale
            eventi_gara.extend(eventi_giro)
        
        # Prepara risultati finali
        risultati = []
        self.piloti.sort(key=lambda p: p.posizione)
        
        for pilota in self.piloti:
            risultati.append({
                "rider_name": pilota.rider_name,
                "rider_country": pilota.rider_country,
                "position": pilota.posizione,
                "completed_laps": pilota.giri_completati,
                "total_time": round(pilota.tempo_totale, 2) if not pilota.ritirato else None,
                "average_lap_time": round(pilota.tempo_totale / pilota.giri_completati, 2) if pilota.giri_completati > 0 and not pilota.ritirato else None,
                "retired": pilota.ritirato,
                "retirement_reason": pilota.motivo_ritiro,
                "points": self.calcola_punti(pilota.posizione) if not pilota.ritirato and pilota.giri_completati == self.giri_totali else 0,
                "rider_profile": {
                    "consistency": round(pilota.consistency_score, 2),
                    "pressure_resistance": round(pilota.pressure_resistance, 2),
                    "fatigue_factor": round(pilota.fatigue_factor, 2),
                    "risk_profile": round(pilota.risk_profile, 2)
                }
            })
        
        return {
            "track_name": self.track_name,
            "total_laps": num_giri,
            "starting_grid": griglia_partenza,
            "race_events": eventi_gara,  # Ora include TUTTI i tipi di eventi
            "final_results": risultati,
            "race_stats": {
                "finishers": len([p for p in self.piloti if not p.ritirato and p.giri_completati == self.giri_totali]),
                "retirements": len([p for p in self.piloti if p.ritirato]),
                "total_participants": len(self.piloti),
                "total_events": len(eventi_gara),
                "ml_enhanced": True
            }
        }
    
    def calcola_punti(self, posizione):
        punti_sistema = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
        return punti_sistema[posizione - 1] if 1 <= posizione <= len(punti_sistema) else 0
    
@app.route("/api/championships/<championship_id>/simulate-race", methods=["POST"])
def simulate_race(championship_id):
    try:
        data = request.get_json()
        track_name = data.get("track_name", "Circuito Generico")
        num_laps = data.get("num_laps", 20)
        
        champ = db.custom_championships.find_one({"_id": ObjectId(championship_id)})
        if not champ:
            return jsonify({"error": "Campionato non trovato."}), 404
        
        piloti_per_simulazione = []
        for rider_in_champ in champ["riders"]:
            rider_db = db.riders.find_one({"Name": rider_in_champ["rider_name"]}, 
                                          {"_id": 0, "Name": 1, "Country": 1, "NormalizedScore": 1})
            if rider_db:
                piloti_per_simulazione.append({
                    "rider_name": rider_db.get("Name"),
                    "rider_country": rider_db.get("Country"),
                    "normalized_score": rider_db.get("NormalizedScore", 0.5)
                })
        
        if not piloti_per_simulazione:
            return jsonify({"error": "Nessun pilota valido trovato nel campionato per la simulazione."}), 400
        
        simulatore = SimulatoreGara(piloti_per_simulazione, track_name)
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
        
        db.custom_championships.update_one(
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

        db.custom_championships.update_one(
            {"_id": ObjectId(championship_id)},
            {"$set": update_set_fields}
        )

        updated_standings = calculate_championship_standings(championship_id)
        
        db.custom_championships.update_one(
            {"_id": ObjectId(championship_id)},
            {"$set": {"standings": updated_standings}}
        )
        
        return jsonify({
            "message": "Gara simulata con successo usando ML!",
            "race_results": risultati_gara,
            "updated_standings": updated_standings
        })
        
    except Exception as e:
        print(f"Errore nella simulazione della gara: {e}")
        return jsonify({"error": f"Errore durante la simulazione: {str(e)}"}), 500

# Mantieni tutte le altre route API identiche...
def calculate_championship_standings(championship_id):
    """Calcola la classifica generale del campionato basata su tutte le gare"""
    champ = db.custom_championships.find_one({"_id": ObjectId(championship_id)})
    if not champ:
        return []
    
    rider_points = {}
    rider_info = {}
    
    for race in champ.get("races", []):
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

# Mantieni tutte le altre route API...
@app.route("/api/riders", methods=["GET"])
def get_riders():
    raw_riders = list(db.riders.find({}, {"_id": 0, "Name": 1, "First Places": 1, "Second Places": 1, "Third Places": 1, "PolesPositions": 1, "WorldChampionships": 1, "Country": 1, "Score": 1, "NormalizedScore": 1}))
    riders = []
    for r in raw_riders:
        riders.append({
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
            "state": c.get("state", "beginning"),
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
    if "races" in champ:
        for race in champ["races"]:
            if "_id" in race and isinstance(race["_id"], ObjectId):
                race["_id"] = str(race["_id"])
    return jsonify(champ)

@app.route("/api/championships/<id>/riders", methods=["PATCH"])
def update_championship_riders(id):
    data = request.get_json()
    action = data.get("action")
    rider = data.get("rider")

    if action not in ("add", "remove"):
        return jsonify({"error": "Azione non valida."}), 400
    if not rider or "rider_name" not in rider:
        return jsonify({"error": "Dati pilota mancanti o non validi."}), 400

    query = {"_id": ObjectId(id)}
    update = {}

    if action == "add":
        update = {"$addToSet": {"riders": rider}}
    elif action == "remove":
        update = {"$pull": {"riders": {"rider_name": rider["rider_name"]}}}
    
    db.custom_championships.update_one(query, update)
    return jsonify({"message": f"Pilota {action}ed correttamente."})

@app.route("/api/championships/<championship_id>/standings", methods=["GET"])
def get_standings(championship_id):
    try:
        champ = db.custom_championships.find_one({"_id": ObjectId(championship_id)})
        if not champ:
            return jsonify({"error": "Campionato non trovato."}), 404
        
        return jsonify(champ.get("standings", []))
        
    except Exception as e:
        return jsonify({"error": f"Errore nel recupero della classifica: {str(e)}"}), 500


@app.route("/api/championships/<championship_id>/standings/recalculate", methods=["POST"])
def recalculate_standings(championship_id):
    try:
        champ = db.custom_championships.find_one({"_id": ObjectId(championship_id)})
        if not champ:
            return jsonify({"error": "Campionato non trovato."}), 404
        
        updated_standings = calculate_championship_standings(championship_id)
        
        db.custom_championships.update_one(
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
