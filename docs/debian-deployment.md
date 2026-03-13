## Running the DNS server on Debian

- **Requirements**
  - Node.js (LTS), npm.
  - This repository cloned to the server.

- **Install dependencies and build**

```bash
cd ~/DNS-Server
npm install
npm run build
```

- **Run the server (development)**

```bash
DNS_HOST=0.0.0.0 DNS_PORT=5300 npm start
```

- **Bind to port 53 via nftables (keep Node on 5300)**

```bash
sudo nft add table inet dnsredir
sudo nft add chain inet dnsredir prerouting { type nat hook prerouting priority 0 \; }
sudo nft add chain inet dnsredir output { type nat hook output priority 0 \; }
sudo nft add rule inet dnsredir prerouting udp dport 53 redirect to 5300
sudo nft add rule inet dnsredir output udp dport 53 redirect to 5300
```

- **Firewall**
  - Ensure UDP/53 is allowed from your LAN / internet:

```bash
sudo iptables -A INPUT -p udp --dport 53 -j ACCEPT
```

- **Systemd service**

Create `/etc/systemd/system/dns-server.service`:

```ini
[Unit]
Description=Node authoritative DNS server
After=network.target

[Service]
WorkingDirectory=/home/adminysf/DNS-Server
Environment=DNS_HOST=0.0.0.0
Environment=DNS_PORT=5300
ExecStart=/usr/bin/npm start
Restart=on-failure
User=adminysf
Group=adminysf

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable dns-server
sudo systemctl start dns-server
```

