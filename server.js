const dgram = require("dgram");
const dnsPacket = require("dns-packet");

console.log("Starting DNS server...");

const server = dgram.createSocket("udp4");

server.on("message", (msg, rinfo) => {
  console.log("Received DNS request from:", rinfo.address);

  const query = dnsPacket.decode(msg);
  console.log("Query for:", query.questions[0].name);

  const response = dnsPacket.encode({
    type: "response",
    id: query.id,
    questions: query.questions,
    answers: [{
      type: "A",
      name: query.questions[0].name,
      ttl: 300,
      data: "192.168.1.10"
    }]
  });

  server.send(response, rinfo.port, rinfo.address);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

server.bind(5300, () => {
  console.log("DNS server running on port 5300");
});
