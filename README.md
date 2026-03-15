# Custom DNS-Server

A simple custom DNS server built with Node.js and TypeScript.
This project demonstrates how DNS works internally by handling DNS queries and returning records from a local zone configuration.

---

### Features

- Lightweight DNS server implementation
- Supports A, AAAA, NS, SOA, and CNAME records
- Zone records configured using a JSON file
- UDP based DNS query handling
- Easy to extend for learning and experimentation
---
### Project Structure

DNS-Server
├── src        # TypeScript source code
├── dist       # Compiled JavaScript files
├── zones      # DNS zone configuration
├── docs       # Documentation and deployment guides

---
### Installation

- Clone the repository:

git clone https://github.com/01iamysf/DNS-Server.git
cd DNS-Server

- Install dependencies:

  - npm install

  - Build the project:

  - npm run build

  - Run the DNS Server

  - sudo node dist/server.js
  
- The server listens on UDP port 53 and resolves domains based on the records defined in "zones/zones.json".

---

### Testing

- Example DNS query:

  dig @127.0.0.1 -p 5300 mysite.dev

  dig @127.0.0.1 -p 5300 ysf.host

  dig @127.0.0.1 -p 5300 doman.name

---

# Author

Md Yusuf
