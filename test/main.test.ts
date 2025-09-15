import { expect, test } from "vitest";
import { GoogleFlights } from "../src/index.js";

test("works", async () => {
  const flights = await new GoogleFlights().searchOneWay({
    fromIATA: "PRG",
    toIATA: "EDI",
    departureDay: "2025-12-20",
    maxTransfers: 0,
  });

  expect(flights).toBeDefined();
  expect(flights).toBeInstanceOf(Array);
  expect(flights?.length).toBeGreaterThan(0);
  expect((flights?.[0] as any).price).toBeDefined();
});
