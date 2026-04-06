export const FLIGHTS_JSPB_HEADER = "x-goog-ext-259736195-jspb";

const REGION_FOR_CURRENCY: Record<string, string> = {
  EUR: "DE",
  USD: "US",
  PLN: "PL",
  GBP: "GB",
  CHF: "CH",
  JPY: "JP",
  CAD: "CA",
  AUD: "AU",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  CZK: "CZ",
  HUF: "HU",
  RON: "RO",
  BGN: "BG",
  ISK: "IS",
  TRY: "TR",
  MXN: "MX",
  BRL: "BR",
  INR: "IN",
  KRW: "KR",
  CNY: "CN",
  HKD: "HK",
  SGD: "SG",
  NZD: "NZ",
  ZAR: "ZA",
};

export function buildFlightsJspbHeader(currencyIso4217: string): string {
  const ccy = currencyIso4217.trim().toUpperCase();
  const region = REGION_FOR_CURRENCY[ccy] ?? "US";
  return JSON.stringify([
    "en-US",
    region,
    ccy,
    2,
    null,
    null,
    null,
    [],
    7,
    [],
  ]);
}
