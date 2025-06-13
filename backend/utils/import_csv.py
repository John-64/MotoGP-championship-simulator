import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[1]
CLEAN_DATA_PATH = PROJECT_ROOT / 'backend/dataset_clean'

# MongoDB connection
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Removing all the existing collections
for collection_name in db.list_collection_names():
    db.drop_collection(collection_name)
    print(f"[X] Collection '{collection_name}' removed")

# CSV import
for filename in os.listdir(CLEAN_DATA_PATH):
    if filename.endswith(".csv"):
        path = f"{CLEAN_DATA_PATH}/{filename}"
        collection_name = os.path.splitext(filename)[0]
        df = pd.read_csv(path)
        data = df.fillna("").to_dict(orient="records")
        db[collection_name].insert_many(data)
        print(f"[✓] Importato {filename} in collection '{collection_name}'")

print("Import completed!")