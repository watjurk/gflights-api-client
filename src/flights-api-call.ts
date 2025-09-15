import { buildRequestBody, type RequestBodyOptions } from "./request-body.js";
import { decodeFlightInfo } from "./decode-flight-info.js";

interface BestFlightsOptions extends RequestBodyOptions {
  oneWay: boolean;
  maxTransfers: number;
}

export async function getBestFlights({
  fromIATA,
  toIATA,
  departureDay,
  oneWay,
  returnDay,
  maxTransfers,
}: BestFlightsOptions) {
  for (let repeat = 0; repeat < 3; repeat++) {
    try {
      return new GoogleFlightsScraper().retrieveBestFlights({
        departureDay,
        oneWay,
        returnDay,
        fromIATA,
        toIATA,
        maxTransfers,
      });
    } catch (e) {
      console.error(e);
    }
  }

  throw new Error("Failed to retrieve flight data after 3 attempts");
}

class GoogleFlightsScraper {
  async retrieveBestFlights({
    departureDay,
    oneWay,
    returnDay,
    fromIATA,
    toIATA,
    maxTransfers,
  }: BestFlightsOptions) {
    const flightData = await this.fetchFlightData({
      departureDay,
      oneWay,
      returnDay,
      fromIATA,
      toIATA,
      maxTransfers,
    });
    const messages = this.parseResponseToMessages(flightData);
    const protobuf = this.parseJSONInMessages(messages);
    return this.parseProtobufInJSONMessages(protobuf);
  }

  async fetchFlightData({
    departureDay,
    oneWay,
    returnDay,
    fromIATA,
    toIATA,
    maxTransfers,
  }: BestFlightsOptions) {
    return fetch(
      "https://www.google.com/_/FlightsFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults",
      {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/130.0",
          Accept: "*/*",
          "Accept-Language": "en;q=0.7,en-US;q=0.3",
          "X-Same-Domain": "1",
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        body: buildRequestBody({
          departureDay: departureDay,
          returnDay: oneWay ? undefined : returnDay,
          fromIATA: fromIATA,
          toIATA: toIATA,
          transfers:
            maxTransfers == 0
              ? "1"
              : maxTransfers == 1
                ? "2"
                : maxTransfers == 2
                  ? "3"
                  : "0",
        }),
      },
    ).then((x) => x.bytes());
  }

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

  async parseProtobufInJSONMessages(jsonMessages: string[][][][][][]) {
    for (let i = 2; i < 5; i++) {
      const cursor = jsonMessages[0]![2]![i];

      if (cursor) {
        try {
          const base64strings = cursor[0]!.map((x) => JSON.parse(x[8]!)[0]);
          return Promise.all(base64strings.map(decodeFlightInfo));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
