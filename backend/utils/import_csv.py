import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

# Carica le variabili da .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[1]
CLEAN_DATA_PATH = PROJECT_ROOT / 'backend/dataset_clean'

# Connessione al DB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

for filename in os.listdir(CLEAN_DATA_PATH):
    if filename.endswith(".csv"):
        path = f"{CLEAN_DATA_PATH}/{filename}"
        collection_name = os.path.splitext(filename)[0]  # prende il nome senza estensione
        df = pd.read_csv(path)
        data = df.fillna("").to_dict(orient="records")
        db[collection_name].delete_many({})  # svuota la collection
        db[collection_name].insert_many(data)
        print(f"[✓] Importato {filename} in collection '{collection_name}'")

print("✅ Importazione completata!")
