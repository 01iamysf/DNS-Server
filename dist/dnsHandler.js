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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDnsQuery = handleDnsQuery;
const dnsPacket = __importStar(require("dns-packet"));
function normalizeName(name) {
    return name.endsWith(".") ? name.slice(0, -1).toLowerCase() : name.toLowerCase();
}
function findZoneForName(zones, qname) {
    const name = normalizeName(qname);
    // Prefer the longest matching suffix (most specific zone)
    return zones
        .filter((z) => name === normalizeName(z.name) || name.endsWith(`.${normalizeName(z.name)}`))
        .sort((a, b) => b.name.length - a.name.length)[0];
}
function hostLabelInZone(qname, zoneName) {
    const name = normalizeName(qname);
    const zone = normalizeName(zoneName);
    if (name === zone) {
        return "@";
    }
    const suffix = `.${zone}`;
    if (name.endsWith(suffix)) {
        return name.slice(0, -suffix.length);
    }
    return name;
}
function recordsForQuestion(zone, qname, qtype) {
    const host = hostLabelInZone(qname, zone.name);
    const recs = zone.records[host] || [];
    if (qtype === "ANY") {
        return recs;
    }
    return recs.filter((r) => r.type === qtype);
}
function toDnsAnswer(qname, record) {
    const name = normalizeName(qname);
    switch (record.type) {
        case "A": {
            const r = record;
            return {
                type: "A",
                name,
                ttl: r.ttl,
                data: r.address,
            };
        }
        case "AAAA": {
            const r = record;
            return {
                type: "AAAA",
                name,
                ttl: r.ttl,
                data: r.address,
            };
        }
        case "NS": {
            const r = record;
            return {
                type: "NS",
                name,
                ttl: r.ttl,
                data: r.host,
            };
        }
        case "SOA": {
            const r = record;
            return {
                type: "SOA",
                name,
                ttl: r.ttl,
                data: {
                    mname: r.mname,
                    rname: r.rname,
                    serial: r.serial,
                    refresh: r.refresh,
                    retry: r.retry,
                    expire: r.expire,
                    minimum: r.minimum,
                },
            };
        }
        default:
            // dns-packet types are string-based; fall back to A shape to avoid crashes
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: record.type,
                name,
                ttl: record.ttl ?? 300,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: record.address ?? record.host,
            };
    }
}
async function handleDnsQuery(query, zones) {
    const answers = [];
    for (const q of query.questions || []) {
        const qname = q.name;
        const qtype = q.type.toUpperCase();
        const zone = findZoneForName(zones, qname);
        if (!zone) {
            continue;
        }
        const recs = recordsForQuestion(zone, qname, qtype);
        for (const rec of recs) {
            answers.push(toDnsAnswer(qname, rec));
        }
        // For SOA/NS queries, if no explicit record is found, fall back to zone-level data
        if (recs.length === 0 && qtype === "SOA") {
            answers.push(toDnsAnswer(zone.name, zone.soa));
        }
        if (recs.length === 0 && qtype === "NS") {
            for (const ns of zone.ns) {
                answers.push(toDnsAnswer(zone.name, ns));
            }
        }
    }
    const response = {
        type: "response",
        id: query.id,
        flags: dnsPacket.AUTHORITATIVE_ANSWER,
        questions: query.questions,
        answers,
    };
    return response;
}
