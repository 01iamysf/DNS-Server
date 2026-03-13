import { promises as fs } from "fs";
import path from "path";
import { Zone } from "./types";

const ZONES_FILE = process.env.ZONES_FILE || path.join("zones", "zones.json");

export async function loadZones(): Promise<Zone[]> {
  try {
    const filePath = path.isAbsolute(ZONES_FILE)
      ? ZONES_FILE
      : path.join(process.cwd(), ZONES_FILE);
    const data = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(data) as Zone[];
    return json;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to load zones from ${ZONES_FILE}. DNS server will start with no zones.`,
      err,
    );
    return [];
  }
}

