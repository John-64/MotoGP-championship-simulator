# MotoGP championship simulator
Piattaforma per la simulazione di campionati di MotoGP, sviluppata per il corso universitario "Basi di Dati II" seguito nell'anno accademico 2024/25 all'Università degli Studi di Salerno.

Sviluppo di una piattaforma web interattiva dedicata alla simulazione di campionati MotoGP personalizzati, basata sui dataset [MotoGP World Championship (1949–2022)](https://www.kaggle.com/datasets/alrizacelk/moto-gp-world-championship19492022) e [MotoGP Race Results](https://www.kaggle.com/datasets/amalsalilan/motogpresultdataset). L'applicazione consente agli utenti di creare nuovi campionati, aggiungere o rimuovere piloti, registrare i risultati delle gare e aggiornare automaticamente la classifica. I risultati possono essere inseriti manualmente oppure generati tramite un algoritmo predittivo che sfrutta le statistiche storiche dei piloti per simulare l’esito delle gare. La piattaforma è realizzata con stack moderno composto da React e Tailwind CSS per il frontend, Flask per il backend, MongoDB per la gestione dei dati e Scikit-learn per l’integrazione di funzionalità di Machine Learning.

# Istruzioni per eseguire l'applicazione
Di seguito le istruzioni per poter provare l'applicazione!

## Prerequisiti
- Python installato
- Node.js e npm installati

## Installazione e avvio
1. Installa le dipendenze Python:
   ```bash
   pip install -r requirements.txt
2. Avvia il backend:
   ```bash
   python app.py
3. Spostati nella cartella del frontend e installa le dipendenze per il frontend:
   ```bash
   cd frontend
   npm install
4. Avvia il frontend:
   ```bash
   npm run dev
5. Apri il browser e visita: http://127.0.0.1:5173
