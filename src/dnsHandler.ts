import * as dnsPacket from "dns-packet";
import {
  Zone,
  ZoneRecord,
  ARecord,
  AAAARecord,
  NSRecord,
  SOARecord,
} from "./types";

const RCODE_NOERROR = 0;
const RCODE_NXDOMAIN = 3;

function normalizeName(name: string): string {
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
function findZoneForName(zones: Zone[], qname: string): Zone | undefined {
  const name = normalizeName(qname);
  const normalizedZones = zones
    .filter((z) => {
      const zName = normalizeName(z.name);
      if (name === zName) return true;
      // Must be a proper subdomain: name ends with .zoneName and has more than zoneName
      if (name.length <= zName.length) return false;
      return name.endsWith("." + zName);
    })
    .sort((a, b) => normalizeName(b.name).length - normalizeName(a.name).length);
  return normalizedZones[0];
}

function hostLabelInZone(qname: string, zoneName: string): string {
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

function recordsForQuestion(
  zone: Zone,
  qname: string,
  qtype: string
): ZoneRecord[] {

  const host = hostLabelInZone(qname, zone.name);
  const recs = zone.records[host] || [];

  if (qtype === "ANY") {
    return recs;
  }

  const filtered = recs.filter((r) => r.type === qtype);

  // If no A record but CNAME exists, return CNAME
  if (filtered.length === 0) {
    const cname = recs.find((r) => r.type === "CNAME");
    if (cname) return [cname];
  }

  return filtered;
}

function toDnsAnswer(qname: string, record: ZoneRecord): dnsPacket.Answer {
  const name = normalizeName(qname);

  switch (record.type) {
    case "A": {
      const r = record as ARecord;
      return {
        type: "A",
        name,
        ttl: r.ttl,
        data: r.address,
      };
    }
    case "AAAA": {
      const r = record as AAAARecord;
      return {
        type: "AAAA",
        name,
        ttl: r.ttl,
        data: r.address,
      };
    }

   case "CNAME": {
     const r = record as ZoneRecord & { value: string; ttl: number };
     return {
    	     type: "CNAME",
    	     name,
    	     ttl: r.ttl,
    	     data: r.value,
     };
   }

    case "NS": {
      const r = record as NSRecord;
      return {
        type: "NS",
        name,
        ttl: r.ttl,
        data: r.host,
      };
    }
    case "SOA": {
      const r = record as SOARecord;
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
        type: (record as ZoneRecord & { type: string }).type,
        name,
        ttl: (record as ZoneRecord & { ttl?: number }).ttl ?? 300,
        data:
          (record as ZoneRecord & { address?: string }).address ??
          (record as ZoneRecord & { host?: string }).host,
      } as dnsPacket.Answer;
  }
}

export async function handleDnsQuery(
  query: dnsPacket.DecodedPacket,
  zones: Zone[]
): Promise<dnsPacket.Packet> {
  const answers: dnsPacket.Answer[] = [];
  let atLeastOneQuestionHadZone = false;

  for (const q of query.questions || []) {
    const qname = q.name;
    const qtype =
      typeof q.type === "string" ? q.type.toUpperCase() : String(q.type);

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
  const shouldReturnNxdomain =
    hasQuestions && !atLeastOneQuestionHadZone;

  const rcode = shouldReturnNxdomain ? RCODE_NXDOMAIN : RCODE_NOERROR;
  const responseFlags =
    (dnsPacket.AUTHORITATIVE_ANSWER as number) | (rcode & 0xf);

  const response: dnsPacket.Packet = {
    type: "response",
    id: query.id,
    flags: responseFlags,
    questions,
    answers: shouldReturnNxdomain ? [] : answers,
  };

  return response;
}
