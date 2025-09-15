`gflights`, an unofficial Node.JS API client for Google Flights

A highly experimental script for scraping flight ticket prices from Google Flights. Decodes the protobuf data returned by Google Flights and returns a JSON array with the results.

## Installation

```bash
npm install gflights
# yarn add gflights
# ...
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
