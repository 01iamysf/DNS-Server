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
const RCODE_NOERROR = 0;
const RCODE_NXDOMAIN = 3;
function normalizeName(name) {
    return name.endsWith(".")
        ? name.slice(0, -1).toLowerCase()
        : name.toLowerCase();
}
/**
 * Find the best matching zone for a query name. Only matches if the name
 * is exactly the zone name or a proper subdomain (e.g. www.yourdomain.com
 * for zone yourdomain.com). Does not match unrelated domains (e.g. google.com
 * never matches zone yourdomain.com).
 */
function findZoneForName(zones, qname) {
    const name = normalizeName(qname);
    const normalizedZones = zones
        .filter((z) => {
        const zName = normalizeName(z.name);
        if (name === zName)
            return true;
        // Must be a proper subdomain: name ends with .zoneName and has more than zoneName
        if (name.length <= zName.length)
            return false;
        return name.endsWith("." + zName);
    })
        .sort((a, b) => normalizeName(b.name).length - normalizeName(a.name).length);
    return normalizedZones[0];
}
function hostLabelInZone(qname, zoneName) {
    const name = normalizeName(qname);
    const zone = normalizeName(zoneName);
    if (name === zone) {
        return "@";
    }
    const suffix = "." + zone;
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
            return {
                type: record.type,
                name,
                ttl: record.ttl ?? 300,
                data: record.address ??
                    record.host,
            };
    }
}
async function handleDnsQuery(query, zones) {
    const answers = [];
    let atLeastOneQuestionHadZone = false;
    for (const q of query.questions || []) {
        const qname = q.name;
        const qtype = typeof q.type === "string" ? q.type.toUpperCase() : String(q.type);
        const zone = findZoneForName(zones, qname);
        if (!zone) {
            continue;
        }
        atLeastOneQuestionHadZone = true;
        const recs = recordsForQuestion(zone, qname, qtype);
        for (const rec of recs) {
            answers.push(toDnsAnswer(qname, rec));
        }
        if (recs.length === 0 && qtype === "SOA") {
            answers.push(toDnsAnswer(zone.name, zone.soa));
        }
        if (recs.length === 0 && qtype === "NS") {
            for (const ns of zone.ns) {
                answers.push(toDnsAnswer(zone.name, ns));
            }
        }
    }
    const questions = query.questions ?? [];
    const hasQuestions = questions.length > 0;
    const shouldReturnNxdomain = hasQuestions && !atLeastOneQuestionHadZone;
    const rcode = shouldReturnNxdomain ? RCODE_NXDOMAIN : RCODE_NOERROR;
    const responseFlags = dnsPacket.AUTHORITATIVE_ANSWER | (rcode & 0xf);
    const response = {
        type: "response",
        id: query.id,
        flags: responseFlags,
        questions,
        answers: shouldReturnNxdomain ? [] : answers,
    };
    return response;
}
