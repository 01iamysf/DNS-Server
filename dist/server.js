"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = __importDefault(require("dgram"));
const dnsPacket = __importStar(require("dns-packet"));
const dnsHandler_1 = require("./dnsHandler");
const zoneStore_1 = require("./zoneStore");
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)();
async function main() {
    const port = Number(process.env.DNS_PORT || 5300);
    const host = process.env.DNS_HOST || "0.0.0.0";
    const zones = await (0, zoneStore_1.loadZones)();
    logger.info(`Loaded ${zones.length} DNS zone(s).`);
    const server = dgram_1.default.createSocket("udp4");
    server.on("error", (err) => {
        logger.error("Server error", { error: err });
    });
    server.on("message", async (msg, rinfo) => {
        const clientInfo = `${rinfo.address}:${rinfo.port}`;
        try {
            const query = dnsPacket.decode(msg);
            logger.info("Received DNS query", {
                client: clientInfo,
                id: query.id,
                questions: query.questions,
            });
            const responsePacket = await (0, dnsHandler_1.handleDnsQuery)(query, zones);
            const response = dnsPacket.encode(responsePacket);
            server.send(response, rinfo.port, rinfo.address, (err) => {
                if (err) {
                    logger.error("Error sending DNS response", { error: err });
                }
            });
        }
        catch (err) {
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
