import dgram from "dgram";
import * as dnsPacket from "dns-packet";
import { handleDnsQuery } from "./dnsHandler";
import { loadZones } from "./zoneStore";
import { createLogger } from "./logger";

const logger = createLogger();

async function main() {
  const port = Number(process.env.DNS_PORT || 5300);
  const host = process.env.DNS_HOST || "0.0.0.0";

  const zones = await loadZones();
  logger.info(`Loaded ${zones.length} DNS zone(s).`);

  const server = dgram.createSocket("udp4");

  server.on("error", (err) => {
    logger.error("Server error", { error: err });
  });

  server.on("message", async (msg, rinfo) => {
    const clientInfo = `${rinfo.address}:${rinfo.port}`;
    try {
      const query = dnsPacket.decode(msg) as dnsPacket.DNSPacket;
      logger.info("Received DNS query", {
        client: clientInfo,
        id: query.id,
        questions: query.questions,
      });

      const responsePacket = await handleDnsQuery(query, zones);
      const response = dnsPacket.encode(responsePacket);

      server.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
          logger.error("Error sending DNS response", { error: err });
        }
      });
    } catch (err) {
      logger.error("Failed to process DNS message", {
        client: clientInfo,
        error: err,
      });
    }
  });

  server.bind(port, host, () => {
    logger.info(`DNS server listening on udp://${host}:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error starting DNS server", err);
  process.exit(1);
});

