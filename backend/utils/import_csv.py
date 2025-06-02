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
    db[collection_name].drop()  # reset
    db[collection_name].insert_many(records)
    print(f"{len(records)} record importati in {collection_name}")

if __name__ == "__main__":
    import_collection("../dataset/riders.csv", "riders")
    import_collection("../dataset/results.csv", "races")