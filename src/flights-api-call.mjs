import { buildRequestBody } from './request-body.js';
import { decodeFlightInfo } from './decode-flight-info.js';

export async function getBestFlights({ fromIATA, toIATA, departureDay, oneWay, returnDay, maxTransfers }) {
    for (let repeat = 0; repeat < 3; repeat++) {
        try {
            return new GoogleFlightsScraper()
                .retrieveBestFlights(departureDay, oneWay, returnDay, fromIATA, toIATA, maxTransfers);
        } catch (e) {
            console.error(e);
        }
    }

    throw new Error('Failed to retrieve flight data after 3 attempts');
};

class GoogleFlightsScraper {
    async retrieveBestFlights(departureDay, oneWay, returnDay, fromIATA, toIATA, maxTransfers) {
        const flightData = await this.fetchFlightData(departureDay, oneWay, returnDay, fromIATA, toIATA, maxTransfers);
        const messages = this.parseResponseToMessages(flightData);
        const protobuf = this.parseJSONInMessages(messages);
        return this.parseProtobufInJSONMessages(protobuf);
    }

    async fetchFlightData(departureDay, oneWay, returnDay, fromIATA, toIATA, maxTransfers) {
        return fetch(
            'https://www.google.com/_/FlightsFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetShoppingResults', {
                method: 'POST',
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/130.0",
                "Accept": "*/*",
                "Accept-Language": "en;q=0.7,en-US;q=0.3",
                "X-Same-Domain": "1",
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin"
            },
            body: buildRequestBody({
                departureDay: departureDay,
                returnDay: oneWay ? undefined : returnDay,
                fromIATA: fromIATA,
                toIATA: toIATA,
                transfers: maxTransfers == 0 ? '1' :
                    maxTransfers == 1 ? '2' :
                        maxTransfers == 2 ? '3' : '0',
            }),
        }).then(x => x.bytes());
    }

    parseResponseToMessages(response) {
        const buffer = response;

        if (buffer[0] !== 0x29 || buffer[1] !== 0x5D || buffer[2] !== 0x7D || buffer[3] !== 0x27 || buffer[4] !== 0x0A || buffer[5] !== 0x0A) {
            throw new Error('Invalid response format');
        }

        // Start processing after the initial bytes
        let offset = 6;

        const messages = [];

        while (offset < buffer.length) {
            if (buffer[offset] === 0x5B && buffer[offset + 1] === 0x5B) {
                const splitResponse = new TextDecoder().decode(buffer.slice(offset));
                messages.push(splitResponse);
                break;
            }

            let length = 0;
            while (buffer[offset] >= 0x30 && buffer[offset] <= 0x39) {
                length = length * 10 + (buffer[offset] - 0x30);
                offset++;
            }

            if (buffer[offset] !== 0x0A) {
                throw new Error('Invalid message format');
            }

            offset++;

            const message = buffer.slice(offset, offset + length);
            messages.push(new TextDecoder().decode(message));

            offset += length;
        }

        return messages;
    }

    parseJSONInMessages(messages) {
        return messages
            .map((x) => JSON.parse(x))
            .filter(x => x[0][0] === 'wrb.fr')
            .map(x => x[0])
            .map(x => {
                x[2] = JSON.parse(x[2]);
                return x;
            });

    }

    async parseProtobufInJSONMessages(jsonMessages) {
        for (let i = 2; i < 5; i++) {
            const cursor = jsonMessages[0][2][i];

            if (cursor) {
                try {
                    const base64strings = cursor[0].map(x => JSON.parse(x[8])[0]);
                    return Promise.all(
                        base64strings.map(decodeFlightInfo)
                    );
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
}

