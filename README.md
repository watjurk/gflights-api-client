`gflights`, an unofficial Node.JS API client for Google Flights

A highly experimental script for scraping flight ticket prices from Google Flights. Decodes the protobuf data returned by Google Flights and returns a JSON array with the results.

## Installation

From npm (if published under that name):

```bash
npm install gflights
```

From this GitHub fork (builds on install via `prepare`):

```bash
npm install github:watjurk/gflights-api-client
```

Pin a version with a [release tag](https://github.com/watjurk/gflights-api-client/releases):

```bash
npm install github:watjurk/gflights-api-client#v0.1.1
```

## Usage

```javascript
import { GoogleFlights } from "gflights";

const flightsApi = new GoogleFlights();

const results = await flightsApi.searchOneWay({
  origin: "JFK",
  destination: "LAX",
  departureDate: "2026-06-03",
  passengers: 1,
});
```
