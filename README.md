# Custom Authoritative DNS Server

A custom, lightweight authoritative DNS server built with **Node.js** and **TypeScript**. 

It operates at the Authoritative DNS Server level in the DNS hierarchy, meaning it directly responds to queries for the domains defined in its local zone configuration (`zones.json`). This project is a fantastic educational tool for understanding how the backbone of the internet works, or for setting up your own local "homelab" environment!

---

### Internet DNS Hierarchy

```text
                Root DNS Servers
                       │
                       ▼
                 TLD Servers
            (.com, .org, .net, etc.)
                       │
                       ▼
           Authoritative DNS Server
                (This Project)
                       │
                       ▼
                  DNS Records
        (A, AAAA, CNAME, NS, SOA)
                       │
                       ▼
                    Client
             (Browser / Device)
```

[View Hierarchy Image](https://github.com/01iamysf/DNS-Server/blob/main/1_goSb1oow5UBNF3KkzvOX8A.png)

---

### Features

- **Lightweight & Fast**: Built from scratch using `dns-packet`.
- **Supported Records**: A, AAAA, NS, SOA, and CNAME records.
- **Easy Configuration**: Define your domains and records in a simple JSON file (`zones/zones.json`).
- **Homelab Ready**: Can be used to hijack local domains for your own internal network.

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/01iamysf/DNS-Server.git
   cd DNS-Server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project (Compile TypeScript to JavaScript):**
   ```bash
   npm run build
   ```

---

### 🚀 Usage: Development & Testing (Port 5300)

By default, the server runs on Port `5300` so that it doesn't require administrator/root privileges, making it safe and easy to test.

1. **Start the server:**
   ```bash
   npm start
   ```
   *(You can also run `npm run dev` to hot-reload TypeScript files directly).*

2. **Test it using `dig`:**
   Open a new terminal and ask your local server to resolve a domain:
   ```bash
   dig @127.0.0.1 -p 5300 mysite.dev +short
   dig @127.0.0.1 -p 5300 ysf.host +short
   ```

---

### 🌐 Usage: Full Local Homelab (Port 53)

If you want to use this DNS server exactly like a production server (so your web browser actually uses it to load websites), it **must** run on Port `53`. 

Because Port 53 is a protected system port, you must run it with `sudo`, and you must ensure your operating system isn't already hogging the port (like `systemd-resolved` on Linux).

1. **Start the server on Port 53:**
   ```bash
   sudo DNS_HOST=127.0.0.1 DNS_PORT=53 $(which node) dist/server.js
   ```

2. **Tell your Operating System to use your server:**
   - Go to your computer's Wi-Fi / Network Settings.
   - Go to the IPv4 settings.
   - Turn off "Automatic DNS" and manually enter `127.0.0.1`.
   - Reconnect to your Wi-Fi to apply the change.

3. **Browser Troubleshooting:**
   - **DNS over HTTPS (DoH):** Modern browsers (like Firefox) encrypt DNS and send it to Cloudflare, ignoring your local server. You must go into Firefox Settings -> DNS -> and turn "Enable DNS over HTTPS" to **Off**.
   - **The `.local` Trap:** Operating systems use mDNS for `.local` domains, which bypasses custom DNS servers. If you are testing locally, use the `.test` TLD in your `zones.json` (e.g., `mysite.test`) because it is officially reserved for local testing!

---

### 🛠️ Adding New Domains

To add new domains, simply edit `zones/zones.json`. 

Example of adding a domain that points to your local machine:
```json
{
  "name": "mysite.test",
  "soa": { ... },
  "ns": [ ... ],
  "records": {
    "@": [
      { "type": "A", "ttl": 300, "address": "127.0.0.1" }
    ],
    "www": [
      { "type": "A", "ttl": 300, "address": "127.0.0.1" }
    ]
  }
}
```
*(Remember to restart the DNS server after editing the JSON file!)*

---

### Author
**Md Yusuf**
