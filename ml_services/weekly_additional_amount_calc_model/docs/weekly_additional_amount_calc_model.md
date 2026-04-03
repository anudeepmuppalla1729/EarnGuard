# Weekly Additional Price Model Approach

This document outlines the architecture and approach taken for the **Weekly Additional Price Calc Model**, built to operate alongside the base price prediction system.

## Overview

The primary goal of this model is to dynamically adjust the base price for each city by calculating a weekly additional pricing increment. It leverages **Google's Gemini 2.5 Flash** Large Language Model (through the `google-genai` SDK) to determine localized risk based on heterogeneous and unstructured data.

The model consumes three primary data pillars:
1. **Weather Data (Semi-structured):** Rainfall, temperatures, and condition alerts.
2. **News Summaries (Unstructured):** Textual descriptions of localized events (e.g., strikes, political unrest, event traffic).
3. **Platform Outages (Structured):** Count and average duration of historical disruptions.

## Architecture

The logic is bifurcated into two separate engines located inside the `weekly_additional_amount_calc_model` package:

### 1. LLM Service (`llm_service.py`)
Because information such as the *news summary* is entirely unstructured ("Flood warnings and transport strike expected next week"), a deterministic NLP engine would be difficult to tune and maintain. 

Instead, the system interfaces with **Gemini 2.5 Flash**. We map the semi-structured and unstructured data streams into a static, deterministic prompt. The LLM is configured to evaluate these combined disruption vectors and extract risk scalars (between `0` and `1`) with high determinism (`temperature=0`).

The agent is locked strictly into generating application/json. If parsing fails, robust fault-tolerance mechanisms enforce a flat fallback of `0.5` across all risk profiles to ensure high availability for the overall transaction pipeline.

### 2. Pricing Engine (`pricing_engine.py`)
After the LLM safely structures the risks, a hardened deterministic mathematical algorithm computes the specific financial adjustments required. By avoiding LLM hallucination in raw pricing numbers, this architecture maintains strictly controlled financial bounds.

The calculation is:

1. **Weighted Risk Extraction:** 
   `weighted_risk = 0.4 * weather_risk + 0.4 * news_risk + 0.2 * outage_risk`
   
2. **Percentage Mapping:**
   Linearly map the risk towards a percentage adjustment:
   `increase_pct = 0.05 + (0.30 * weighted_risk)`
   
3. **Clamping Strategy:**
   Bound the final percentage from `5%` to `35%` variance against the base price to guard against outliers.
   
4. **Final Arithmetic:**
   Calculated final price and final weekly price increment values are formulated and directly appended to the system's output object. 

This hybrid architecture (LLM NLP structure -> Deterministic financial math) ensures both rich contextual parsing and safe, bounded API outputs.
