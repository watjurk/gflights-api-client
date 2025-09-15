import protobuf from "protobufjs";
import { flightInfo } from "./flight-info.proto.js";

export async function decodeFlightInfo(base64encoded: string) {
  return new Promise((r) => {
    const root = protobuf.parse(flightInfo);

    if (!root) throw new Error("Failed to load protobuf root");

    const message = root.root.lookupType("FlightScraper.FlightInfo");

    const x: any = message.decode(Buffer.from(base64encoded, "base64"));

    x.price.amount = Math.floor(x.price.amount / Math.pow(10, x.precision));
    r(x);
  });
}
