export type RecordType = "A" | "AAAA" | "NS" | "SOA" | "CNAME";

export interface ARecord {
  type: "A";
  ttl: number;
  address: string;
}

export interface AAAARecord {
  type: "AAAA";
  ttl: number;
  address: string;
}

export interface CNAMERecord {
  type: "CNAME";
  ttl: number;
  value: string;
}

export interface NSRecord {
  type: "NS";
  ttl: number;
  host: string;
}

export interface SOARecord {
  type: "SOA";
  ttl: number;
  mname: string;
  rname: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimum: number;
}

export type ZoneRecord = ARecord | AAAARecord | NSRecord | SOARecord | CNAMERecord;

export interface Zone {
  name: string;
  soa: SOARecord;
  ns: NSRecord[];
  records: {
    [host: string]: ZoneRecord[];
  };
}

