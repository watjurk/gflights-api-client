import protobuf from "protobufjs";

export async function decodeFlightInfo(base64encoded) {
    return new Promise(r => {
        protobuf.load(import.meta.dirname + "/flight-info.proto", function(err, root) {
            if (err)
                throw err;

            const message = root.lookupType("FlightScraper.FlightInfo");

            const x = message.decode(Buffer.from(base64encoded, 'base64'));

            x.price.amount = Math.floor(x.price.amount / (Math.pow(10, x.precision)));
            r(x);
        });
    });
}
