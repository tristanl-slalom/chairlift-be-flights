# Test Flights Reference

This document lists all predefined test flights available in the system after running the seed script.

## Quick Start

### Seed the Database
```bash
npm run seed
```

## Available Routes

All flights depart on **2024-03-15** (March 15, 2024)

### Seattle (SEA) ↔ Los Angeles (LAX)

| Flight | Route | Departure | Arrival | Duration | Economy | Business | First |
|--------|-------|-----------|---------|----------|---------|----------|-------|
| SL100 | SEA → LAX | 08:00 | 11:00 | 3h 0m | $199 | $599 | $999 |
| SL101 | SEA → LAX | 14:00 | 17:00 | 3h 0m | $249 | $649 | $1099 |
| SL200 | LAX → SEA | 09:00 | 12:00 | 3h 0m | $199 | $599 | $999 |

### Seattle (SEA) ↔ New York (JFK)

| Flight | Route | Departure | Arrival | Duration | Economy | Business | First |
|--------|-------|-----------|---------|----------|---------|----------|-------|
| SL300 | SEA → JFK | 07:00 | 15:30 | 5h 30m | $399 | $1299 | $2499 |
| SL301 | SEA → JFK | 18:00 | 02:30+1 | 5h 30m | $349 | $1199 | $2299 |
| SL400 | JFK → SEA | 08:00 | 11:30 | 6h 30m | $399 | $1299 | $2499 |

### Other Routes

| Flight | Route | Departure | Arrival | Duration | Economy | Business | First |
|--------|-------|-----------|---------|----------|---------|----------|-------|
| SL500 | SFO → JFK | 09:00 | 17:30 | 5h 30m | $379 | $1199 | $2399 |
| SL600 | LAX → JFK | 10:00 | 18:30 | 5h 30m | $359 | $1149 | $2299 |
| SL700 | ORD → LAX | 11:00 | 14:00 | 4h 0m | $299 | $899 | $1699 |
| SL800 | MIA → SEA | 06:00 | 11:30 | 6h 30m | $449 | $1399 | $2599 |

## Airport Codes Reference

| Code | Airport | City |
|------|---------|------|
| SEA | Seattle-Tacoma International | Seattle, WA |
| LAX | Los Angeles International | Los Angeles, CA |
| JFK | John F. Kennedy International | New York, NY |
| SFO | San Francisco International | San Francisco, CA |
| ORD | O'Hare International | Chicago, IL |
| MIA | Miami International | Miami, FL |

## Aircraft Details

All flights use modern aircraft with comfortable seating:
- **Boeing 737**: Short to medium haul (120 economy, 20 business, 10 first)
- **Boeing 787**: Long haul (180 economy, 30 business, 12 first)
- **Airbus A321**: Medium haul (150 economy, 25 business, 10 first)

## Test Search Examples

### Frontend Testing
Use these searches in the booking interface:
1. **Seattle to LA** - Search: SEA → LAX on 2024-03-15 (2 flights available)
2. **Cross-country** - Search: SEA → JFK on 2024-03-15 (2 flights available)
3. **Return flight** - Search: LAX → SEA on 2024-03-15 (1 flight available)

### API Testing
```bash
# Search flights
curl "https://mwp7sgahh7.execute-api.us-west-2.amazonaws.com/prod/api/flights/search?origin=SEA&destination=LAX&departureDate=2024-03-15"

# Get specific flight
curl "https://mwp7sgahh7.execute-api.us-west-2.amazonaws.com/prod/api/flights/test-sl100"
```

## Reseeding

To clear and reseed all test flights:
```bash
# The seed script uses PutCommand which overwrites existing items
npm run seed
```

Each flight has a predictable ID: `test-{flightNumber}` (e.g., `test-sl100`)
