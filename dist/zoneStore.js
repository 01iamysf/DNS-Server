"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadZones = loadZones;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const ZONES_FILE = process.env.ZONES_FILE || path_1.default.join("zones", "zones.json");
async function loadZones() {
    try {
        const filePath = path_1.default.isAbsolute(ZONES_FILE)
            ? ZONES_FILE
            : path_1.default.join(process.cwd(), ZONES_FILE);
        const data = await fs_1.promises.readFile(filePath, "utf8");
        const json = JSON.parse(data);
        return json;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load zones from ${ZONES_FILE}. DNS server will start with no zones.`, err);
        return [];
    }
}
