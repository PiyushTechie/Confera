# Mediasoup SFU Migration & Oracle Cloud Deployment Guide

## 1. Current Progress

The backend SFU infrastructure is fully implemented! 
- **Backend:** `mediasoup` is installed, configured (`mediaManager.js`), and `app.js` is now completely handling `produce`, `consume`, and `connectTransport` events instead of P2P signaling.
- **Frontend SDK:** `MediasoupClient.js` has been created in `src/lib/` to handle the complex WebRTC transport logic.

> [!WARNING]
> **Important Note on `VideoMeet.jsx` Refactor**: Because your `VideoMeet.jsx` is a massive component (~2,700 lines), injecting the final Mediasoup hook logic directly into it risks breaking the entire UI state (screen sharing, audio toggling, host controls). The safest way to complete the transition is to extract the video grid into a smaller sub-component that imports `MediasoupClient.js` directly, rather than patching the massive monolithic file. 

## 2. Oracle Cloud Setup Guide (100% Free Forever)

Once your frontend is fully wired to the Mediasoup backend, you must deploy it to a server that can handle video routing. Render's free tier cannot handle this, but Oracle Cloud's "Always Free" tier is incredibly powerful.

### Step 1: Create the Account
1. Go to the [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) website and sign up.
2. *Note: You will need a valid credit card for verification, but as long as you select "Always Free" resources, you will never be charged.*

### Step 2: Spin up the Instance
1. Log into your Oracle Cloud Console.
2. Click **Create a VM instance**.
3. Under **Image and Shape**:
   - Change Image to **Ubuntu 22.04** (or latest LTS).
   - Change Shape to **Ampere (ARM)**. Select `VM.Standard.A1.Flex`.
   - Allocate **4 OCPUs** and **24 GB Memory**. (This is the maximum allowed on the Always Free tier).
4. **Networking**: Ensure you assign a Public IPv4 address.
5. **SSH Keys**: Download the automatically generated private key (you will need this to connect to the server!).
6. Click **Create**.

### Step 3: Configure Firewall (Ingress Rules)
Mediasoup requires specific ports to be open for WebRTC UDP traffic.
1. In Oracle Cloud, click on your instance's **Subnet**.
2. Click on the **Default Security List**.
3. Add Ingress Rules:
   - **TCP Port 8000**: For your Express server/Socket.io. (Source CIDR: `0.0.0.0/0`)
   - **UDP Ports 40000-49999**: For Mediasoup WebRTC Video/Audio traffic. (Source CIDR: `0.0.0.0/0`)
4. SSH into the server and run:
   ```bash
   sudo iptables -I INPUT -p tcp -m tcp --dport 8000 -j ACCEPT
   sudo iptables -I INPUT -p udp -m udp --dport 40000:49999 -j ACCEPT
   sudo netfilter-persistent save
   ```

### Step 4: Deploy the Backend
1. Connect to your instance via SSH:
   ```bash
   ssh -i path/to/your/key.key ubuntu@<YOUR_ORACLE_PUBLIC_IP>
   ```
2. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs build-essential python3
   ```
   *(Note: `build-essential` and `python3` are required to compile Mediasoup on ARM).*
3. Clone your repository:
   ```bash
   git clone <YOUR_REPO_URL>
   cd Confera/backend
   ```
4. Install dependencies and PM2 (for keeping the server alive):
   ```bash
   npm install
   sudo npm install -g pm2
   ```
5. Create your `.env` file on the server:
   ```bash
   nano .env
   # Add your MONGO_URL, REDIS_URL, etc.
   # CRITICAL: Add ANNOUNCED_IP=<YOUR_ORACLE_PUBLIC_IP>
   ```
6. Start the server:
   ```bash
   pm2 start src/app.js --name "confera-backend"
   pm2 save
   ```

### Step 5: Update Frontend
Finally, in your frontend code (which you can keep hosted on Render or Vercel), update `environment.js` to point to your new Oracle Public IP!
```javascript
const server = "http://<YOUR_ORACLE_PUBLIC_IP>:8000";
```
