import os
import pandas as pd
import difflib
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[1]
RAW_DATA_PATH = PROJECT_ROOT / "dataset"
CLEAN_DATA_PATH = PROJECT_ROOT / 'backend/dataset_clean'
os.makedirs(CLEAN_DATA_PATH, exist_ok=True)

def normalize_name(name):
    # Semplice pulizia e case title
    return " ".join(part.capitalize() for part in name.strip().split())

# Funzione fuzzy match con difflib
def fuzzy_match_rider(name, choices, cutoff=0.8):
    matches = difflib.get_close_matches(name, choices, n=1, cutoff=cutoff)
    if matches:
        return matches[0]
    else:
        return name

# Caricamento dataset
same_nation_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'same-nation-podium-lockouts.csv'))
riders_info_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'riders-info.csv'))
riders_pos_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'riders-finishing-positions.csv'))
winners_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'grand-prix-race-winners.csv'))
events_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'grand-prix-events-held.csv'))
constructors_df = pd.read_csv(os.path.join(RAW_DATA_PATH, 'constructure-world-championship.csv'))

# Rinomina colonne
same_nation_df.rename(columns={"Riders Nation": "Riders Nation"}, inplace=True)

# Normalizza nomi piloti in tutti dataset
riders_info_df['Riders All Time in All Classes'] = riders_info_df['Riders All Time in All Classes'].apply(normalize_name)
riders_pos_df['Rider'] = riders_pos_df['Rider'].apply(normalize_name)
winners_df['Rider'] = winners_df['Rider'].apply(normalize_name)

# Lista master nomi pilota
master_rider_names = riders_info_df['Riders All Time in All Classes'].tolist()

# Applica fuzzy match con difflib
riders_pos_df['Rider'] = riders_pos_df['Rider'].apply(lambda x: fuzzy_match_rider(x, master_rider_names))
winners_df['Rider'] = winners_df['Rider'].apply(lambda x: fuzzy_match_rider(x, master_rider_names))

# Merge dati piloti
merged_riders = pd.merge(
    riders_info_df,
    riders_pos_df,
    left_on='Riders All Time in All Classes',
    right_on='Rider',
    how='outer'
).drop(columns=['Rider'])

# Mappa team (Constructor) da winners_df
# Ordina il DataFrame per Rider e Season decrescente
winners_df_sorted = winners_df.sort_values(['Rider', 'Season'], ascending=[True, False])

# Prendi la prima riga per ogni Rider (la più recente)
latest_per_rider = winners_df_sorted.groupby('Rider', as_index=False).first()

# Mappa Rider -> Constructor
latest_team_per_rider = dict(zip(latest_per_rider['Rider'], latest_per_rider['Constructor']))

merged_riders['Team'] = merged_riders['Riders All Time in All Classes'].map(latest_team_per_rider)

# Salvataggio file pulito
merged_riders.to_csv(os.path.join(CLEAN_DATA_PATH, 'rider.csv'), index=False)
# Salvataggio degli altri dataset "puliti" o semplicemente rinominati e sistemati

# Se vuoi salvare il dataframe dei vincitori arricchito (ad esempio con colonne normalizzate)
winners_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'winners.csv'), index=False)

# Salva il dataset degli eventi (tracciati)
events_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'events.csv'), index=False)

# Salva il dataset dei costruttori
constructors_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'constructors.csv'), index=False)

# Salva anche il dataset same_nation se vuoi
same_nation_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'same_nation.csv'), index=False)

print(f"Altri file puliti salvati in {CLEAN_DATA_PATH}")
tracks_df = events_df[['Track', 'Country']].drop_duplicates()
tracks_df.to_csv(os.path.join(CLEAN_DATA_PATH, 'tracks.csv'), index=False)

print(f"Pulizia completata. File salvato in {CLEAN_DATA_PATH}")