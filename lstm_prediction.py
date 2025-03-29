import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
import glob


# Define the LSTM model
class LSTM(nn.Module):
    def __init__(self, input_size=1, hidden_layer_size=50, output_size=1):
        super(LSTM, self).__init__()
        self.hidden_layer_size = hidden_layer_size
        self.lstm = nn.LSTM(input_size, hidden_layer_size, batch_first=True)
        self.linear = nn.Linear(hidden_layer_size, output_size)

    def forward(self, input_seq):
        lstm_out, _ = self.lstm(input_seq)
        predictions = self.linear(lstm_out[:, -1])
        return predictions


# Create dataset function
def create_dataset(data, time_step=1):
    X, Y = [], []
    for i in range(len(data) - time_step - 1):
        a = data[i:(i + time_step), 0]
        X.append(a)
        Y.append(data[i + time_step, 0])
    return np.array(X), np.array(Y)


# Function to process and save sensor data for a specific sensor ID
def process_and_save_sensor_data(directory, sensor_id, save_directory):
    # Ensure the save directory exists
    os.makedirs(save_directory, exist_ok=True)

    # Initialize DataFrame for the sensor ID
    sensor_data_df = pd.DataFrame()

    all_files = []
    # List all CSV files in the given directory
    for subdir, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.csv'):
                file_path = os.path.join(subdir, file)
                all_files.append(file_path)

    for file in all_files:
        # Read the current file
        df = pd.read_csv(file,encoding='gb2312')
        df['MDATE'] = pd.to_datetime(df['MDATE'])

        # Filter data for the sensor ID and append to the DataFrame
        if sensor_id in df['SENSOR_ID'].values:
            filtered_data = df[df['SENSOR_ID'] == sensor_id]
            sensor_data_df = pd.concat([sensor_data_df, filtered_data], ignore_index=True)

    # Save the sorted sensor data to a CSV file in the designated save directory if not empty
    if not sensor_data_df.empty:
        sensor_data_df = sensor_data_df.sort_values(by='MDATE').reset_index(drop=True)
        file_path = os.path.join(save_directory, f"{sensor_id}_sorted_data.csv")
        sensor_data_df.to_csv(file_path, index=False)
        print(f"Sorted data for sensor {sensor_id} saved to {file_path}")

    return sensor_data_df


# LSTM training and prediction function
def train_and_predict_lstm(anomaly_file, save_folder, model_folder):
    anomaly_df = pd.read_csv(anomaly_file)
    anomaly_df['MDATE'] = pd.to_datetime(anomaly_df['MDATE'])
    anomaly_df = anomaly_df.sort_values(by=['MDATE']).reset_index(drop=True)
    anomaly_sensor_ids = anomaly_df['SENSOR_ID'].unique()

    for sensor_id in anomaly_sensor_ids:
        sorted_data_path = os.path.join(save_folder, f"{sensor_id}_sorted_data.csv")
        if os.path.exists(sorted_data_path):
            print(f"Reading sorted data from {sorted_data_path}")
            sensor_data_df = pd.read_csv(sorted_data_path)
        else:
            print(f"No sorted data file found for sensor {sensor_id}, processing data...")
            sensor_data_df = process_and_save_sensor_data(data_directory, sensor_id, save_folder)

        if not sensor_data_df.empty:
            sensor_data = sensor_data_df['M_RESULT'].values

            # Normalize data
            scaler = MinMaxScaler(feature_range=(0, 1))
            sensor_data_scaled = scaler.fit_transform(sensor_data.reshape(-1, 1))

            # Create dataset
            time_step = 10
            X, Y = create_dataset(sensor_data_scaled, time_step)

            # Convert to Tensor
            X = torch.tensor(X, dtype=torch.float32).unsqueeze(-1)
            Y = torch.tensor(Y, dtype=torch.float32)

            # Split into training and testing set
            train_size = int(len(X) * 0.7)
            X_train, X_test = X[:train_size], X[train_size:]
            Y_train, Y_test = Y[:train_size], Y[train_size:]

            # Build LSTM model
            model = LSTM()
            loss_function = nn.MSELoss()
            optimizer = optim.Adam(model.parameters(), lr=0.001)

            # DataLoader
            train_data = TensorDataset(X_train, Y_train)
            train_loader = DataLoader(train_data, batch_size=1, shuffle=False)

            # Train model
            epochs = 1
            for epoch in range(epochs):
                for seq, labels in train_loader:
                    optimizer.zero_grad()
                    model.hidden_cell = (torch.zeros(1, seq.size(0), model.hidden_layer_size),
                                         torch.zeros(1, seq.size(0), model.hidden_layer_size))

                    y_pred = model(seq)

                    single_loss = loss_function(y_pred, labels.unsqueeze(1))
                    single_loss.backward()
                    optimizer.step()

                print(f'{sensor_id} Epoch {epoch + 1} loss: {single_loss.item()}')

            # Save model
            model_save_path = os.path.join(model_folder, f'{sensor_id}_model.pth')
            torch.save(model.state_dict(), model_save_path)
            print(f'Model saved for sensor {sensor_id} at {model_save_path}')


            anomalies = anomaly_df[anomaly_df['SENSOR_ID'] == sensor_id]
            for index, row in anomalies.iterrows():
                # Find the index of the anomaly in the full data
                anomaly_index = sensor_data_df[sensor_data_df['MDATE'] == row['MDATE']].index[0]
                print(anomaly_index)

                if anomaly_index >= 10:  # Ensure there are at least 10 preceding data points
                    start_index = anomaly_index - 10
                    sequence = sensor_data_scaled[start_index:anomaly_index].reshape(1, 10, 1)
                    sequence_tensor = torch.tensor(sequence, dtype=torch.float32)

                    # Predict
                    with torch.no_grad():
                        prediction = model(sequence_tensor).item()
                    prediction = scaler.inverse_transform([[prediction]])[0][0]

                    # Save the prediction
                    anomalies.loc[index, 'Prediction'] = prediction

            # Save completed anomaly data
            anomaly_completed_file = os.path.join(save_folder, f'{sensor_id}_anomaly_completed.csv')
            anomalies.to_csv(anomaly_completed_file, index=False, encoding='utf-8')
            print(f'Anomaly data saved for sensor {sensor_id} at {anomaly_completed_file}')


# Directory containing CSV files and IDs to process
data_directory = './索力数据'
save_directory = './merge'
model_folder = './models'
os.makedirs(model_folder, exist_ok=True)

# Train and predict
anomaly_file = './anomaly/anomaly_info.csv'
train_and_predict_lstm(anomaly_file, save_directory, model_folder)
# import os
# import pandas as pd
# import numpy as np
# import torch
# import torch.nn as nn
# import torch.optim as optim
# from torch.utils.data import DataLoader, TensorDataset
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.svm import SVR
# from sklearn.linear_model import LinearRegression
# import glob
# import joblib  # 用于保存 SVR 和线性回归模型
#
#
# # Define the LSTM model
# class LSTM(nn.Module):
#     def __init__(self, input_size=1, hidden_layer_size=50, output_size=1):
#         super(LSTM, self).__init__()
#         self.hidden_layer_size = hidden_layer_size
#         self.lstm = nn.LSTM(input_size, hidden_layer_size, batch_first=True)
#         self.linear = nn.Linear(hidden_layer_size, output_size)
#
#     def forward(self, input_seq):
#         lstm_out, _ = self.lstm(input_seq)
#         predictions = self.linear(lstm_out[:, -1])
#         return predictions
#
#
# # Create dataset function
# def create_dataset(data, time_step=1):
#     X, Y = [], []
#     for i in range(len(data) - time_step - 1):
#         a = data[i:(i + time_step), 0]
#         X.append(a)
#         Y.append(data[i + time_step, 0])
#     return np.array(X), np.array(Y)
#
#
# # Function to process and save sensor data for a specific sensor ID
# def process_and_save_sensor_data(directory, sensor_id, save_directory):
#     # Ensure the save directory exists
#     os.makedirs(save_directory, exist_ok=True)
#
#     # Initialize DataFrame for the sensor ID
#     sensor_data_df = pd.DataFrame()
#
#     all_files = []
#     # List all CSV files in the given directory
#     for subdir, _, files in os.walk(directory):
#         for file in files:
#             if file.endswith('.csv'):
#                 file_path = os.path.join(subdir, file)
#                 all_files.append(file_path)
#
#     for file in all_files:
#         # Read the current file
#         df = pd.read_csv(file,encoding='gb2312')
#         df['MDATE'] = pd.to_datetime(df['MDATE'])
#
#         # Filter data for the sensor ID and append to the DataFrame
#         if sensor_id in df['SENSOR_ID'].values:
#             filtered_data = df[df['SENSOR_ID'] == sensor_id]
#             sensor_data_df = pd.concat([sensor_data_df, filtered_data], ignore_index=True)
#
#     # Save the sorted sensor data to a CSV file in the designated save directory if not empty
#     if not sensor_data_df.empty:
#         sensor_data_df = sensor_data_df.sort_values(by='MDATE').reset_index(drop=True)
#         file_path = os.path.join(save_directory, f"{sensor_id}_sorted_data.csv")
#         sensor_data_df.to_csv(file_path, index=False)
#         print(f"Sorted data for sensor {sensor_id} saved to {file_path}")
#
#     return sensor_data_df
#
#
# # Training and prediction function with algorithm selection
# def train_and_predict(sensor_id,sensor_data, algorithm='LSTM'):
#     if algorithm == 'LSTM':
#         # Normalize data
#         # scaler = MinMaxScaler(feature_range=(0, 1))
#         # sensor_data_scaled = scaler.fit_transform(sensor_data.reshape(-1, 1))
#
#         # Create dataset
#         time_step = 10
#         X, Y = create_dataset(sensor_data, time_step)
#
#         # Convert to Tensor
#         X = torch.tensor(X, dtype=torch.float32).unsqueeze(-1)
#         Y = torch.tensor(Y, dtype=torch.float32)
#
#         # Split into training and testing set
#         train_size = int(len(X) * 0.7)
#         X_train, X_test = X[:train_size], X[train_size:]
#         Y_train, Y_test = Y[:train_size], Y[train_size:]
#
#         # Build LSTM model
#         model = LSTM()
#         loss_function = nn.MSELoss()
#         optimizer = optim.Adam(model.parameters(), lr=0.001)
#
#         # DataLoader
#         train_data = TensorDataset(X_train, Y_train)
#         train_loader = DataLoader(train_data, batch_size=1, shuffle=False)
#
#         # Train model
#         epochs = 1
#         for epoch in range(epochs):
#             for seq, labels in train_loader:
#                 optimizer.zero_grad()
#                 model.hidden_cell = (torch.zeros(1, seq.size(0), model.hidden_layer_size),
#                                      torch.zeros(1, seq.size(0), model.hidden_layer_size))
#
#                 y_pred = model(seq)
#                 single_loss = loss_function(y_pred, labels.unsqueeze(1))
#                 single_loss.backward()
#                 optimizer.step()
#
#             print(f'Epoch {epoch + 1} loss: {single_loss.item()}')
#
#         # Save LSTM model
#         model_save_path = os.path.join(model_folder, f'{sensor_id}_{algorithm}_model.pth')
#         torch.save(model.state_dict(), model_save_path)
#         print(f'LSTM model saved at {model_save_path}')
#
#         return model
#
#     elif algorithm == 'SVR':
#         # Prepare data for SVR
#         time_step = 10
#         X, Y = create_dataset(sensor_data, time_step)
#
#         # Normalize data
#         scaler_X = MinMaxScaler()
#         scaler_Y = MinMaxScaler()
#         X = scaler_X.fit_transform(X)
#         Y = scaler_Y.fit_transform(Y.reshape(-1, 1)).flatten()
#
#         # Train SVR model
#         model = SVR()
#         model.fit(X, Y)
#
#         model_save_path = os.path.join(model_folder, f'{sensor_id}_{algorithm}_model.joblib')
#         joblib.dump(model, model_save_path)
#         print(f'SVR model saved at {model_save_path}')
#
#         return model, (scaler_X, scaler_Y)
#
#     elif algorithm == 'LinearRegression':
#         # Prepare data for Linear Regression
#         time_step = 10
#         X, Y = create_dataset(sensor_data, time_step)
#
#         # Train Linear Regression model
#         model = LinearRegression()
#         model.fit(X, Y)
#
#         # Save Linear Regression model
#         model_save_path = os.path.join(model_folder, f'{sensor_id}_{algorithm}_model.joblib')
#         joblib.dump(model, model_save_path)
#         print(f'Linear Regression model saved at {model_save_path}')
#
#         return model, None
#
#     else:
#         raise ValueError("Algorithm must be one of 'LSTM', 'SVR', or 'LinearRegression'")
#
#
# # Main function for training and predicting anomalies with algorithm choice
# def main(anomaly_file, save_folder, model_folder, algorithm='LSTM'):
#     anomaly_df = pd.read_csv(anomaly_file)
#     anomaly_df['MDATE'] = pd.to_datetime(anomaly_df['MDATE'])
#     anomaly_df = anomaly_df.sort_values(by=['MDATE']).reset_index(drop=True)
#     anomaly_sensor_ids = anomaly_df['SENSOR_ID'].unique()
#
#     for sensor_id in anomaly_sensor_ids:
#         sorted_data_path = os.path.join(save_folder, f"{sensor_id}_sorted_data.csv")
#         if os.path.exists(sorted_data_path):
#             print(f"Reading sorted data from {sorted_data_path}")
#             sensor_data_df = pd.read_csv(sorted_data_path)
#         else:
#             print(f"No sorted data file found for sensor {sensor_id}, processing data...")
#             sensor_data_df = process_and_save_sensor_data(data_directory, sensor_id, save_folder)
#
#         if not sensor_data_df.empty:
#             sensor_data = sensor_data_df['M_RESULT'].values
#
#             # Normalize data
#             scaler = MinMaxScaler(feature_range=(0, 1))
#             sensor_data_scaled = scaler.fit_transform(sensor_data.reshape(-1, 1))
#             model = train_and_predict(sensor_id,sensor_data_scaled,algorithm)
#
#             anomalies = anomaly_df[anomaly_df['SENSOR_ID'] == sensor_id]
#             for index, row in anomalies.iterrows():
#                 # print(row)
#                 anomaly_index = sensor_data_df[sensor_data_df['MDATE'] == row['MDATE']].index[0]
#                 if anomaly_index >= 10:  # Ensure there are enough data points
#                     start_index = anomaly_index - 10
#                     sequence = sensor_data[start_index:anomaly_index].reshape(1, -1)
#
#                     # Predict based on the selected algorithm
#                     if algorithm == 'LSTM':
#                         sequence_tensor = torch.tensor(sequence, dtype=torch.float32).unsqueeze(-1)
#                         with torch.no_grad():
#                             prediction = model(sequence_tensor).item()
#                         prediction = scaler.inverse_transform([[prediction]])[0][0]
#
#                     elif algorithm == 'SVR':
#                         sequence_scaled = scaler[0].transform(sequence)
#                         prediction = model.predict(sequence_scaled)
#                         prediction = scaler[1].inverse_transform([[prediction[0]]])[0][0]
#
#                     elif algorithm == 'LinearRegression':
#                         prediction = model.predict(sequence)[0]
#
#                     # Save the prediction
#                     anomalies.loc[index, 'Prediction'] = prediction
#
#             # Save completed anomaly data with algorithm name
#             anomaly_completed_file = os.path.join(save_folder, f'{sensor_id}_anomaly_completed_{algorithm}.csv')
#             anomalies.to_csv(anomaly_completed_file, index=False, encoding='utf-8')
#             print(f'Anomaly data saved for sensor {sensor_id} at {anomaly_completed_file}')
#
#
# # Directory and file paths
# data_directory = './索力数据'
# save_directory = './merge'
# model_folder = './models'
# os.makedirs(model_folder, exist_ok=True)
#
# # Run the main function with the desired algorithm
# anomaly_file = './anomaly/anomaly_info.csv'
# main(anomaly_file, save_directory, model_folder,
#      algorithm='LSTM')  # Replace 'SVR' with 'LSTM' or 'LinearRegression' as needed
