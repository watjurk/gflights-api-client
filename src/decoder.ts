import { type RequestBodyOptions } from "./request-body.js";
import protobuf from "protobufjs";
import { flightInfo } from "./protobuf/flight-info.proto.js";

export interface OneWayOptions extends RequestBodyOptions {
  maxTransfers: number;
}

export class GoogleFlightsDecoder {
  static protobufRootCache: Map<string, protobuf.Root | null> = new Map();

  parseResponseToMessages(response: Uint8Array) {
    const buffer = response;

    if (
      buffer[0] !== 0x29 ||
      buffer[1] !== 0x5d ||
      buffer[2] !== 0x7d ||
      buffer[3] !== 0x27 ||
      buffer[4] !== 0x0a ||
      buffer[5] !== 0x0a
    ) {
      throw new Error("Invalid response format");
    }

    // Start processing after the initial bytes
    let offset = 6;

    const messages = [];

    while (offset < buffer.length) {
      if (buffer[offset] === 0x5b && buffer[offset + 1] === 0x5b) {
        const splitResponse = new TextDecoder().decode(buffer.slice(offset));
        messages.push(splitResponse);
        break;
      }

      let length = 0;
      const currentByte = buffer[offset];
      while (
        currentByte !== undefined &&
        currentByte >= 0x30 &&
        currentByte <= 0x39
      ) {
        length = length * 10 + (currentByte - 0x30);
        offset++;
      }

      if (currentByte !== 0x0a) {
        throw new Error("Invalid message format");
      }

      offset++;

      const message = buffer.slice(offset, offset + length);
      messages.push(new TextDecoder().decode(message));

      offset += length;
    }

    return messages;
  }

  parseJSONInMessages(messages: string[]) {
    return messages
      .map((x) => JSON.parse(x))
      .filter((x) => x[0][0] === "wrb.fr")
      .map((x) => x[0])
      .map((x) => {
        x[2] = JSON.parse(x[2]);
        return x;
      });
  }

  async parseProtobufInJSONMessages<T>(jsonMessages: string[][][][][][]): Promise<T | undefined> {
    for (let i = 2; i < 5; i++) {
      const cursor = jsonMessages[0]![2]![i];

      if (cursor) {
        try {
          const base64strings = cursor[0]!.map((x) => JSON.parse(x[8]!)[0]);
          return Promise.all(base64strings.map(this.decodeFlightInfo)) as any;
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  async decodeFlightInfo(base64encoded: string) {
  return new Promise((r) => {
    if (!GoogleFlightsDecoder.protobufRootCache.has("flightInfo")) {
      GoogleFlightsDecoder.protobufRootCache.set("flightInfo", protobuf.parse(flightInfo).root);
    }

    const root = GoogleFlightsDecoder.protobufRootCache.get("flightInfo");

    if (!root) throw new Error("Failed to load protobuf root");

    const message = root.root.lookupType("FlightScraper.FlightInfo");

    const x: any = message.decode(Buffer.from(base64encoded, "base64"));

    x.price.amount = Math.floor(x.price.amount / Math.pow(10, x.precision));
    r(x);
  });
}
}
