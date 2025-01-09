from flask import Flask, jsonify
from datetime import datetime
import pandas as pd
from prophet import Prophet
from prophet.make_holidays import make_holidays_df

app = Flask(__name__)

# Load and preprocess the data
df = pd.read_csv('https://raw.githubusercontent.com/kyriten/skripsi/main/Data%20Stasiun%20Kota%20Bogor%20Tanah%20Sereal%202024-05-21_14.05.32.csv')

# Preprocess: sesuaikan tipe data
df['Waktu'] = pd.to_datetime(df['Waktu'])
pollutants = ['PM10', 'PM2.5', 'SO2', 'CO', 'O3', 'NO2', 'HC']

# Function to fill missing data
def fill_missing_data(df, columns):
    missing_columns = [col for col in pollutants if col not in df.columns]
    if missing_columns:
        return jsonify({"error": f"Missing columns: {', '.join(missing_columns)}"}), 400

    for col in columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(method='ffill').fillna(method='bfill')
    return df

df = fill_missing_data(df, pollutants)
df.set_index('Waktu', inplace=True)
df = df.resample('H').mean().reset_index()

model_cache = {}  # Cache untuk model yang sudah dibuat

def create_model(data, column):
    if column not in model_cache:
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=True,
            holidays=make_holidays_df(year_list=[2022, 2023, 2024, 2025], country='ID')
        )
        data = data[['Waktu', column]].rename(columns={'Waktu': 'ds', column: 'y'})
        print(f"Data for {column}:")
        print(data.head())
        model.add_seasonality(name='monthly', period=30.5, fourier_order=5)  
        model.fit(data)
        model_cache[column] = model
    model = model_cache[column]
    future = model.make_future_dataframe(periods=365)
    forecast = model.predict(future)
    return forecast

# Create forecast for multiple pollutants
def get_forecasts(): 
    forecasts = {}
    today = datetime.now() 

    for pollutant in pollutants:
        forecast = create_model(df, pollutant)

        # Pastikan kolom 'ds' diformat sebagai datetime
        forecast["ds"] = pd.to_datetime(forecast["ds"])

        # Filter prediksi mulai dari hari ini
        forecast = forecast[forecast["ds"] >= today]

        # Ambil 15 hari ke depan
        forecast = forecast.head(7)
        
        # Format tanggal sebagai string (YYYY-MM-DD) di kolom 'ds'
        forecast["ds"] = forecast["ds"].dt.strftime('%Y-%m-%d')

        # Log untuk debug
        print(f"Forecast for {pollutant}:")
        print(forecast.head())  # Pastikan kolom 'ds' ada
        
        forecasts[pollutant] = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    return forecasts

@app.route('/air-quality', methods=['GET'])
def get_air_quality():
    try:
        # Ambil data prediksi untuk tanggal dan waktu saat ini
        current_time = datetime.now()

        predictions = {}

        # Loop untuk setiap polutan
        for pollutant in pollutants:
            # Gunakan model yang telah dibuat sebelumnya untuk memprediksi data
            forecast = create_model(df, pollutant)

            forecast['ds'] = forecast['ds'].dt.date 
            current_time_date = current_time.date()

            # Prediksi untuk tanggal saat ini
            prediction = forecast[forecast['ds'] == current_time_date]

            # Jika prediksi ditemukan
            if not prediction.empty:
                predictions[pollutant] = {
                    'prediction': int(round(prediction['yhat'].values[0])),
                    'prediction_lower': int(round(prediction['yhat_lower'].values[0])),
                    'prediction_upper': int(round(prediction['yhat_upper'].values[0])),
                    'timestamp': current_time.strftime('%Y-%m-%d')
                }
            else:
                predictions[pollutant] = {
                    'prediction': None,
                    'prediction_lower': None,
                    'prediction_upper': None,
                    'timestamp': current_time.strftime('%Y-%m-%d')
                }
        return jsonify(predictions)

    except Exception as e:
        
        return jsonify({"error": str(e)}), 500
    
@app.route('/forecast', methods=['GET'])
def forecast(): 
    try:
        # Ambil prediksi mulai hari ini
        forecasts = get_forecasts()
        result = {}

        for pollutant, forecast in forecasts.items():
            # Kolom 'ds' sudah diformat sebagai string dalam get_forecasts
            forecast["date"] = forecast["ds"]  # Langsung gunakan kolom 'ds' sebagai 'date'

            # Agregasi data harian (average)
            daily_forecast = (
                forecast.groupby("date")
                .agg(
                    yhat=("yhat", "mean"),
                    yhat_lower=("yhat_lower", "mean"),
                    yhat_upper=("yhat_upper", "mean"),
                )
                .reset_index()
            )

            # Ubah nilai polutan menjadi integer
            daily_forecast["yhat"] = daily_forecast["yhat"].round().astype(int)
            daily_forecast["yhat_lower"] = daily_forecast["yhat_lower"].round().astype(int)
            daily_forecast["yhat_upper"] = daily_forecast["yhat_upper"].round().astype(int)

            result[pollutant] = daily_forecast.to_dict(orient="records")

        return jsonify(result)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/predict/<date>', methods=['GET'])
def predict(date):
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        predictions = []

        for pollutant in pollutants:
            forecast = create_model(df, pollutant)
            prediction = forecast[forecast['ds'].dt.date == date_obj.date()]
            
            if not prediction.empty:
                predictions.append({
                    "pollutant": pollutant,
                    "date": date,
                    "prediction": prediction['yhat'].values[0],
                    "prediction_lower": prediction['yhat_lower'].values[0],
                    "prediction_upper": prediction['yhat_upper'].values[0]
                })
            else:
                predictions.append({
                    "pollutant": pollutant,
                    "date": date,
                    "prediction": None
                })

        return jsonify(predictions)  # Tetap kembalikan dalam bentuk array JSON/list

    except ValueError:
        return jsonify({"error": "Invalid date format, expected YYYY-MM-DD"}), 400

if __name__ == '__main__':
    app.run(debug=True)
