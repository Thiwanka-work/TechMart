# TechMart Deployment Guide

This document contains important data and steps for deploying the TechMart application to AWS.

## 1. Architecture
- **Frontend**: React/Vite application hosted on **AWS S3** (`techmart-live-site-123`).
- **Backend**: ASP.NET Core 8 Web API hosted on **AWS EC2** (Ubuntu).
- **Database**: PostgreSQL hosted on **AWS RDS**.
- **Reverse Proxy**: Nginx running on EC2, routing port 80 traffic to port 5000 (Kestrel).

## 2. Important Configuration Data
*Warning: Do not commit actual passwords or API keys to version control.*

### Production Database (RDS)
The backend requires an `appsettings.Production.json` file to be present in the publish directory or locally before zipping.
Format of `appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=techmart-1.colssa2gg05x.us-east-1.rds.amazonaws.com;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SslMode=Require;TrustServerCertificate=true"
  }
}
```

### Gemini API Key
The `appsettings.json` requires the Gemini API key for the Chatbot functionality:
```json
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY"
  }
```

## 3. Deployment Steps

### Step 1: Prepare the Frontend (S3)
1. Run `npm run build` in `TechMart.UI`.
2. Open the AWS S3 Console for bucket `techmart-live-site-123`.
3. Delete all existing files.
4. Upload all contents of the `TechMart.UI/dist` folder via Drag & Drop.

### Step 2: Prepare the Backend (EC2)
1. Ensure `appsettings.json` has the Gemini API Key.
2. Ensure `appsettings.Production.json` has the RDS PostgreSQL credentials.
3. Run `dotnet publish -c Release -o ./publish` in `TechMart.API`.
4. Create a ZIP of the `publish` folder (e.g., `techmart-backend.zip`).
5. Upload the ZIP to the `techmart-live-site-123` S3 bucket.
6. Generate a **Presigned URL** for the ZIP file from S3 (valid for 15-20 mins).

### Step 3: Update the Server (EC2 Terminal)
Run the following commands in the EC2 instance terminal (replace the URL with your presigned URL):

```bash
# 1. Delete old published files
rm -rf /home/ubuntu/publish/*

# 2. Download the new zip
wget "YOUR_PRESIGNED_URL" -O /home/ubuntu/techmart-backend.zip

# 3. Extract
unzip -o /home/ubuntu/techmart-backend.zip -d /home/ubuntu/publish/

# 4. Restart the service
sudo systemctl restart techmart.service

# 5. Check status
sudo systemctl status techmart.service
```
