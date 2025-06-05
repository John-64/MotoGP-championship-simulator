import os
import pandas as pd
import difflib
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[1]
RAW_DATA_PATH = PROJECT_ROOT / "dataset"
CLEAN_DATA_PATH = PROJECT_ROOT / 'backend/dataset_clean'
os.makedirs(CLEAN_DATA_PATH, exist_ok=True)

# Dataset loading
riders_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'riders-info.csv'))
track_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'grand-prix-events-held.csv'))

riders_df.rename(columns={
    'Riders All Time in All Classes': 'Name',
    'Victories': 'First Places',
    '2nd places': 'Second Places',
    '3rd places': 'Third Places',
    'Pole positions from \'74 to 2022': 'Number poles positions',
    'World Championships': 'Number World Championships'
}, inplace=True)

riders_df.drop(columns=['Race fastest lap to 2022'], inplace=True)
track_df.drop(columns=['Times'], inplace=True)


# Saving CSV
riders_df.to_csv(CLEAN_DATA_PATH / 'riders.csv', index=False)
track_df.to_csv(CLEAN_DATA_PATH / 'track.csv', index=False)