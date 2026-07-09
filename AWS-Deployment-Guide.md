# TechMart - AWS Production Deployment Guide

This document outlines the professional deployment architecture and step-by-step setup used to host the TechMart application on AWS.

## ?? 1. Architecture Overview

- **Database:** AWS RDS (PostgreSQL) - Managed database for secure and reliable data storage.
- **Backend API:** ASP.NET Core 8 Web API.
- **Hosting Server:** AWS EC2 Instance (Ubuntu Linux).
- **Process Manager:** `systemd` (Keeps the API running in the background and auto-restarts on crash/reboot).
- **Web Server / Reverse Proxy:** Nginx (Listens on Port 80 and securely forwards internet traffic to the internal .NET API running on Port 5000).

---

## ?? 2. How to Connect to the Server

Use PowerShell or Git Bash from your local PC to SSH into the EC2 instance using your `.pem` key:

```bash
# Example SSH command (Replace IP and Key path accordingly)
ssh -i "C:\path\to\techmart-key.pem" ubuntu@44.201.48.64
```

---

## ?? 3. Backend Deployment Steps

### A. Publish & Upload Code
1. Compile the C# project in Visual Studio or via CLI: `dotnet publish -c Release`.
2. Upload the contents of the `publish` folder to the EC2 server (e.g., to `/home/ubuntu/publish`).

### B. Setup `systemd` Service (Daemon)
This ensures the backend runs continuously in the background.

1. Open the service configuration file:
   ```bash
   sudo nano /etc/systemd/system/techmart.service
   ```
2. Add the following configuration (Ensure the `dotnet` path is correct by running `which dotnet`):
   ```ini
   [Unit]
   Description=TechMart .NET Web API

   [Service]
   WorkingDirectory=/home/ubuntu/publish
   ExecStart=/snap/bin/dotnet /home/ubuntu/publish/TechMart.API.dll
   Restart=always
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=techmart-api
   User=ubuntu
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=ASPNETCORE_URLS=http://localhost:5000

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable techmart.service
   sudo systemctl start techmart.service
   ```

### C. Setup Nginx (Reverse Proxy)
Nginx accepts incoming HTTP requests and forwards them to the running .NET application.

1. Install Nginx: `sudo apt install nginx -y`
2. Create site configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/techmart
   ```
3. Add the configuration:
   ```nginx
   server {
       listen 80;
       server_name 44.201.48.64; # Replace with your Domain or IP

       location / {
           proxy_pass         http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header   Upgrade $http_upgrade;
           proxy_set_header   Connection keep-alive;
           proxy_set_header   Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header   X-Forwarded-Proto $scheme;
       }
   }
   ```
4. Enable the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/techmart /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## ?? 4. How to Update Code in the Future

When you make changes to your local code and want to update the live server:

1. Build and `publish` your updated code locally.
2. Upload the new files to `/home/ubuntu/publish` on the EC2 server (replacing the old files).
3. Restart the backend service so it picks up the new code:
   ```bash
   sudo systemctl restart techmart.service
   ```

## ?? 5. Useful Commands

- **Check API Status:** `sudo systemctl status techmart.service`
- **View Live Backend Logs (Errors/Prints):** `sudo journalctl -fu techmart.service`
- **Restart Nginx:** `sudo systemctl restart nginx`

---

## ?? 6. AWS Free Tier Best Practices & Warnings

If you are hosting this on the **AWS Free Tier** (e.g., `t2.micro` or `t3.micro`), please keep the following in mind to avoid unexpected charges and server crashes:

1. **RAM Limitations (1 GB):**
   - Free tier EC2 instances only have 1 GB of RAM. Running the .NET API and Nginx is perfectly fine, but avoid installing heavy applications (like SQL Server or large Docker containers) directly on this EC2 instance.
   - *Good Architecture:* Using AWS RDS for PostgreSQL (as configured) is the correct approach, as it offloads the database processing from your EC2 instance.

2. **Public IP Changes (Elastic IP):**
   - If you **Stop and Start** your EC2 instance from the AWS Console, your Public IP (`44.201.48.64`) will change. 
   - *Solution:* Allocate an **Elastic IP** in AWS and attach it to your EC2 instance. Elastic IPs are 100% free **as long as** they are attached to a running EC2 instance. This keeps your IP permanent.

3. **Set Up a Billing Alarm:**
   - Always go to the AWS Billing Dashboard and set up a CloudWatch Billing Alarm for `$1.00`. If you accidentally exceed free tier limits (like taking too many EBS snapshots or exceeding data transfer limits), AWS will email you immediately before the bill gets huge.

4. **RDS Storage & Backups:**
   - Free tier RDS gives you 20 GB of storage. Make sure you don't store large files (like user-uploaded images) in the database. Instead, store images in an AWS S3 bucket (which also has a free tier) or locally in the `wwwroot` folder.
