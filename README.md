# MotoGP championship simulator
This project involves the development of an interactive web platform dedicated to simulating custom MotoGP championships, based on the dataset [MotoGP World Championship (1949–2022)](https://www.kaggle.com/datasets/alrizacelk/moto-gp-world-championship19492022). The application allows users to:
- Create new championships;
- Add or remove riders;
- Record race results;
- Automatically update the standings.

Race outcomes are simulated through a predictive algorithm that leverages riders’ historical performance data.

<p align="center"> 
    <img src="media/logoProgetto.png" alt="Output" width="15%">
</p>

## Prerequisites
- [Python](https://www.python.org/downloads/)
- [Node.js](https://nodejs.org/en/download)

## Installation
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
2. Start the backend:
   ```bash
   python app.py
3. Move to the frontend folder and install the frontend dependencies:
   ```bash
   cd frontend
   npm install
4. Start the frontend:
   ```bash
   npm run dev
5. Open your browser and go to:
    ```bash
   http://127.0.0.1:5173

## Demo
Here are a few screenshots of the simulator!
<p align="center"> 
    <img src="media/5. MotoGPSImulator.png" alt="Output" width="45%">
    <img src="media/7. MotoGPSImulator.png" alt="Output" width="45%">
</p>
<p align="center"> 
    <img src="media/9. MotoGPSImulator.png" alt="Output" width="45%">
    <img src="media/4. MotoGPSImulator.png" alt="Output" width="45%">
</p>

## Credits
- [MotoGP](https://www.motogp.com/)
- [Font](https://www.deviantart.com/nerdyboy1803/art/MGP-Font-Family-1131219299)
- [Kaggle](https://www.kaggle.com/datasets/alrizacelk/moto-gp-world-championship19492022)
- [Wikipedia](https://it.wikipedia.org/wiki/MotoGP)

## Info
This project was created for the course "Basi di Dati II" at the Università degli Studi di Salerno.

## Contribution
If you'd like to contribute to Bloky, please follow these steps:
- Fork the repository;
- Create a new branch (```git checkout -b feature/YourFeatureName```);
- Commit your changes (```git commit -m 'Add some feature'```);
- Push to the branch (```git push origin feature/YourFeatureName```);
- Open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
