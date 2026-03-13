## Configure your domain to use this DNS server

- **1. Own a domain**
  - Buy a domain from a registrar (Namecheap, GoDaddy, etc.).

- **2. Set up nameserver host records (glue)**
  - At the registrar, create host records:
    - `ns1.yourdomain.com` → your Debian server public IP.

- **3. Point NS records to your server**
  - In the registrar panel, set the domain’s nameservers to:
    - `ns1.yourdomain.com`

- **4. Configure the zone file**
  - Edit `zones/zones.json` on the Debian server to match your real domain and IP:

```json
[
  {
    "name": "yourrealdomain.com",
    "soa": {
      "type": "SOA",
      "ttl": 300,
      "mname": "ns1.yourrealdomain.com",
      "rname": "admin.yourrealdomain.com",
      "serial": 1,
      "refresh": 3600,
      "retry": 600,
      "expire": 1209600,
      "minimum": 300
    },
    "ns": [
      {
        "type": "NS",
        "ttl": 300,
        "host": "ns1.yourrealdomain.com"
      }
    ],
    "records": {
      "@": [
        {
          "type": "A",
          "ttl": 300,
          "address": "YOUR_SERVER_PUBLIC_IP"
        }
      ],
      "www": [
        {
          "type": "A",
          "ttl": 300,
          "address": "YOUR_SERVER_PUBLIC_IP"
        }
      ]
    }
  }
]
```

- **5. Reload the DNS server**
  - If running under systemd:

```bash
sudo systemctl restart dns-server
```

- **6. Test from outside**

```bash
dig @YOUR_SERVER_PUBLIC_IP yourrealdomain.com A
dig yourrealdomain.com A
```

If the second command works (without `@IP`) after propagation, the public DNS system is using your server correctly, and your website will be reachable on that domain as long as your web server listens for that hostname.

