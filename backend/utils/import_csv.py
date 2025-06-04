import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Connessione al DB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Mappatura file in collection
csv_map = {
    "constructure-world-championship.csv": "constructors",
    "grand-prix-events-held.csv": "races",
    "grand-prix-race-winners.csv": "race_winners",
    "riders-finishing-positions.csv": "results",
    "riders-info.csv": "riders",
    "same-nation-podium-lockouts.csv": "podium_lockouts"
}


base_path = Path(__file__).resolve().parent.parent / "dataset"

# Importazione
for filename, collection_name in csv_map.items():
    path = f"{base_path}/{filename}"
    df = pd.read_csv(path, encoding="utf-8")
    data = df.fillna("").to_dict(orient="records")
    db[collection_name].delete_many({})
    db[collection_name].insert_many(data)
    print(f"[✓] Importato {filename} in collection '{collection_name}'")

print("Importazione completata!")
