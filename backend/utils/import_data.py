import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

def import_collection(csv_path, collection_name):
    df = pd.read_csv(csv_path)
    records = df.to_dict(orient='records')
    db[collection_name].drop()
    db[collection_name].insert_many(records)
    print(f"{len(records)} record importati in '{collection_name}'")

if __name__ == "__main__":
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../dataset"))

    datasets = {
        "constructure-world-championship.csv": "constructors",
        "grand-prix-events-held.csv": "events",
        "grand-prix-race-winners.csv": "winners",
        "riders-finishing-positions.csv": "finishing_positions",
        "riders-info.csv": "riders",
        "same-nation-podium-lockouts.csv": "podium_lockouts",
    }

    for filename, collection in datasets.items():
        csv_path = os.path.join(base_path, filename)
        import_collection(csv_path, collection)
