import random
from dataclasses import dataclass
from typing import List, Optional
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import pandas as pd

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
    
    consistency_score: float = 0.3  # Rider consistency
    pressure_resistance: float = 0.4  # Pressure resistance
    fatigue_factor: float = 0.6  # Rider fatigue
    risk_profile: float = 0.2  # Risk profile

class MLRacePredictor:
    """Classe per le predizioni ML nella gara"""
    
    def __init__(self):
        self.lap_time_model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.incident_model = RandomForestRegressor(n_estimators=30, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_synthetic_training_data(self, n_samples=1000):
        """Genera dati sintetici per allenare i modelli"""

        data = []
        for _ in range(n_samples):
            # Rider features
            normalized_score = random.uniform(0.1, 1.0)
            consistency = random.uniform(0.2, 0.9)
            pressure_resistance = random.uniform(0.2, 0.9)
            fatigue_factor = random.uniform(0.3, 0.8)
            
            # Race features
            current_lap = random.randint(1, 25)
            total_laps = random.randint(15, 30)
            position = random.randint(1, 20)
            total_riders = random.randint(12, 24)
            
            # Environment features
            race_progress = current_lap / total_laps
            is_final_phase = 1 if race_progress > 0.75 else 0
            relative_position = position / total_riders
            
            # Target: race time (related to features)
            base_time = 90 - (normalized_score * 10)  # Best rider have lower base times
            consistency_var = (1 - consistency) * 3  # Minus consistency is equal to more variance
            pressure_effect = (1 - pressure_resistance) * race_progress * 2
            fatigue_effect = fatigue_factor * race_progress * 1.5
            
            lap_time = base_time + random.gauss(0, consistency_var) + pressure_effect + fatigue_effect
            lap_time = max(80, min(110, lap_time))  # Clamp
            
            # Target: incident probability
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
        
        # Features for both models
        feature_cols = [
            'normalized_score', 'consistency', 'pressure_resistance', 'fatigue_factor',
            'current_lap', 'total_laps', 'race_progress', 'is_final_phase',
            'position', 'total_riders', 'relative_position'
        ]
        
        X = df[feature_cols].values
        X_scaled = self.scaler.fit_transform(X)
        
        # Training lap time model
        y_laptime = df['lap_time'].values
        self.lap_time_model.fit(X_scaled, y_laptime)
        
        # Training incident model
        y_incident = df['incident_prob'].values
        self.incident_model.fit(X_scaled, y_incident)
        
        self.is_trained = True
        print("Modelli ML allenati con successo!")
    
    def predict_lap_time(self, pilota: PilotaGara, current_lap: int, total_laps: int, current_position: int, total_riders: int) -> float:
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
        
        # Additional noise
        noise = random.gauss(0, 0.5)
        return max(80, predicted_time + noise)
    
    def predict_incident_probability(self, pilota: PilotaGara, current_lap: int, total_laps: int, current_position: int, total_riders: int) -> float:
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
        
        # Cluster riders to assign characteristics
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
            # If too few pilots, assign random characteristics
            for pilota in piloti_data:
                pilota["consistency_score"] = random.uniform(0.3, 0.8)
                pilota["pressure_resistance"] = random.uniform(0.3, 0.8)
                pilota["fatigue_factor"] = random.uniform(0.4, 0.7)
                pilota["risk_profile"] = random.uniform(0.3, 0.8)
            return
        
        # Extract features for clustering
        features = []
        for pilota in piloti_data:
            score = pilota.get("normalized_score", 0.5)
            features.append([
                score,
                score + random.gauss(0, 0.1),
                score + random.gauss(0, 0.15),
                0.6 - score * 0.2 + random.gauss(0, 0.1)
            ])
        
        # Cluster into 3 groups: conservative, balanced, aggressive
        n_clusters = min(3, len(piloti_data))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(features)
        
        for i, pilota in enumerate(piloti_data):
            cluster = clusters[i]
            base_score = pilota.get("normalized_score", 0.5)
            
            if cluster == 0:  # Cluster conservative
                pilota["consistency_score"] = min(0.9, base_score + random.uniform(0.1, 0.2))
                pilota["pressure_resistance"] = min(0.9, base_score + random.uniform(0.05, 0.15))
                pilota["fatigue_factor"] = max(0.3, base_score - random.uniform(0.1, 0.2))
                pilota["risk_profile"] = random.uniform(0.2, 0.4)
            elif cluster == 1:  # Cluster balanced
                pilota["consistency_score"] = base_score + random.uniform(-0.1, 0.1)
                pilota["pressure_resistance"] = base_score + random.uniform(-0.1, 0.1)
                pilota["fatigue_factor"] = 0.6 + random.uniform(-0.15, 0.15)
                pilota["risk_profile"] = random.uniform(0.4, 0.7)
            else:  # Cluster aggressive
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
        
        # We apply the day bonus (reduces or increases the time)
        base_time *= (1 - pilota.bonus_giornata)
        
        # We add random noise +/- 2%
        noise_factor = random.uniform(0.98, 1.02)
        base_time *= noise_factor
        
        # We limit minimum time (example 60s)
        base_time = max(base_time, 60.0)
        
        return base_time
    
    def controlla_incidenti_ml(self, pilota: PilotaGara) -> bool:
        """Gestisce incidenti usando ML"""
        if pilota.ritirato:
            return False
        
        # Use ML to Predict Accident Probability
        incident_prob = self.ml_predictor.predict_incident_probability(
            pilota, self.giro_attuale, self.giri_totali,
            pilota.posizione, len(self.piloti)
        )
        
        # Change probability based on risk profile
        risk_multiplier = 0.5 + pilota.risk_profile
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
        
        # Save positions before the lap to identify overtaking
        posizioni_precedenti = {p.rider_name: p.posizione for p in self.piloti}
        
        # Simulate the lap for each driver
        random.shuffle(self.piloti)
        
        for pilota in self.piloti:
            if pilota.ritirato:
                continue
            
            # Check for incidents before calculating time
            if self.controlla_incidenti_ml(pilota):
                eventi_giro.append({
                    "tipo": "ritiro",
                    "pilota": pilota.rider_name,
                    "motivo": pilota.motivo_ritiro,
                    "giro": self.giro_attuale
                })
                continue
            
            tempo_giro = self.calcola_tempo_giro_ml(pilota)
            
            bonus = random.uniform(-0.5, 0.5)
            tempo_giro += bonus
            
            pilota.tempo_totale += tempo_giro
            pilota.giri_completati += 1
            
            if pilota.penalita_tempo_giro_corrente > 0:
                eventi_giro.append({
                    "tipo": "errore_lieve",
                    "pilota": pilota.rider_name,
                    "motivo": f"Tempo perso: {round(pilota.penalita_tempo_giro_corrente, 2)}s",
                    "giro": self.giro_attuale
                })
                pilota.penalita_tempo_giro_corrente = 0
        
        # Update positions after simulating all pilots
        self.aggiorna_posizioni()
        
        # Check positions
        for pilota in self.piloti:
            if pilota.ritirato:
                continue
                
            pos_precedente = posizioni_precedenti.get(pilota.rider_name)
            pos_attuale = pilota.posizione
            
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
        
        if not self.ml_predictor.is_trained:
            self.ml_predictor.train_models()
        
        for pilota in self.piloti:
            pilota.bonus_giornata = random.uniform(-0.05, 0.05)
        
        griglia_partenza = [{"rider_name": p.rider_name, "position": p.posizione} for p in self.piloti]
        
        eventi_gara = []
        
        # Simulate every laps
        for giro in range(1, num_giri + 1):
            self.giro_attuale = giro
            eventi_giro = self.simula_giro()
            
            # Add the events
            eventi_gara.extend(eventi_giro)
        
        # Preparing the final results
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
            "race_events": eventi_gara,
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