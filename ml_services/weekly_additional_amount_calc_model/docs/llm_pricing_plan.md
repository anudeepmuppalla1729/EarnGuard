# Weekly Risk Pricing System (LLM-Based)

## Overview

This system calculates weekly additional pricing using an LLM for risk
reasoning combined with deterministic rules.

------------------------------------------------------------------------

## Architecture

1.  Collect Inputs (Weather, News, Outages)
2.  Preprocess Data
3.  LLM Risk Scoring
4.  Validate Output
5.  Apply Pricing Formula
6.  Store Results in PostgreSQL

------------------------------------------------------------------------

## LLM Prompt

You are a risk assessment engine for pricing.

Inputs: - Weather: {weather_data} - News Summary: {news_summary} -
Outages: {outage_data}

Tasks: 1. Assign risk scores (0 to 1): - weather_risk - news_risk -
outage_risk 2. Provide short reasoning

Output JSON: { "weather_risk": float, "news_risk": float, "outage_risk":
float, "reason": "short explanation" }

------------------------------------------------------------------------

## Pricing Formula

weighted_risk = 0.4 \* weather + 0.4 \* news + 0.2 \* outage

weekly_addition = base_price \* min(weighted_risk, 0.3)

------------------------------------------------------------------------

## Tech Stack

-   LLM API (GPT / Claude)
-   Python (FastAPI)
-   PostgreSQL
-   Redis (optional queue)

------------------------------------------------------------------------

## Future Improvements

-   Add historical logging
-   Train ML model later
-   Add trend-based adjustments
