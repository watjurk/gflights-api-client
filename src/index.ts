import {
  GoogleFlightsDecoder as Decoder,
  type OneWayOptions,
} from "./decoder.js";
import type { FlightInfo } from "./protobuf/flight-info.proto.js";
import {
  buildFlightsJspbHeader,
  FLIGHTS_JSPB_HEADER,
} from "./currency-jspb.js";
import { RequestBuilder } from "./request-body.js";

export class GoogleFlights {
  decoder = new Decoder();
  requestBuilder = new RequestBuilder();

  async searchOneWay(options: OneWayOptions): Promise<FlightInfo[]> {
    const { fromIATA, toIATA, departureDay, maxTransfers, currency } = options;

    const flightData = await this.fetchFlightData({
      departureDay,
      fromIATA,
      toIATA,
      maxTransfers,
      ...(currency ? { currency } : {}),
    });
    const messages = this.decoder.parseResponseToMessages(flightData);
    const protobuf = this.decoder.parseJSONInMessages(messages);
    return (await this.decoder.parseProtobufInJSONMessages<FlightInfo[]>(protobuf) ?? []);
  }

  async fetchFlightData({
    departureDay,
    fromIATA,
    toIATA,
    maxTransfers,
    currency,
  }: OneWayOptions) {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/130.0",
      Accept: "*/*",
      "Accept-Language": "en;q=0.7,en-US;q=0.3",
      "X-Same-Domain": "1",
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    };
    if (currency) {
      headers[FLIGHTS_JSPB_HEADER] = buildFlightsJspbHeader(currency);
    }
    return fetch(
      "https://www.google.com/_/FlightsFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults",
      {
        method: "POST",
        headers,
        body: this.requestBuilder.buildRequestBody({
          departureDay: departureDay,
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
}
