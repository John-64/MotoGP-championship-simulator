import os
import pandas as pd
from pathlib import Path

# Path configuration
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[1]
RAW_DATA_PATH = PROJECT_ROOT / "dataset"
CLEAN_DATA_PATH = PROJECT_ROOT / 'backend/dataset_clean'
os.makedirs(CLEAN_DATA_PATH, exist_ok=True)

# Dataset loading
riders_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'riders-finishing-positions.csv'))
riders_stats_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'riders-info.csv'))

track_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'grand-prix-events-held.csv'))

# Rider refactoring
riders_df.rename(columns={'Rider': 'Name'}, inplace=True)
riders_df.drop(columns=['Victories', 'NumberofSecond', 'NumberofThird', 'Numberof4th', 'Numberof5th', 'Numberof6th'], inplace=True)
riders_df['Name'] = riders_df['Name'].apply(lambda x: ' '.join(x.title().split()[::-1]))

riders_stats_df.rename(columns={
    'Riders All Time in All Classes': 'Name',
    'Victories': 'First Places',
    '2nd places': 'Second Places',
    '3rd places': 'Third Places',
    'Pole positions from \'74 to 2022': 'PolesPositions',
    'World Championships': 'WorldChampionships'
}, inplace=True)

riders_stats_df.drop(columns=['Race fastest lap to 2022'], inplace=True)
riders_stats_df['Name'] = riders_stats_df['Name'].str.title()

riders_clean_df = riders_df.drop_duplicates("Name")

profile_complete = pd.merge(riders_stats_df, riders_clean_df, on="Name", how="left")
profile_complete.fillna(0, inplace=True)

# Track refactoring
track_df.drop(columns=['Times'], inplace=True)

# Score setting
profile_complete["Score"] = (
    profile_complete["First Places"] * 4 +
    profile_complete["Second Places"] * 2 +
    profile_complete["Third Places"] * 1 +
    profile_complete["PolesPositions"] * 1.5 +
    profile_complete["WorldChampionships"] * 6
)

# Normalization
max_score = profile_complete["Score"].max()
profile_complete["NormalizedScore"] = profile_complete["Score"] / max_score

# Saving
track_df.to_csv(CLEAN_DATA_PATH / 'track.csv', index=False)
profile_complete.to_csv(CLEAN_DATA_PATH / 'rider.csv', index=False)