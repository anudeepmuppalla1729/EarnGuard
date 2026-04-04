import os
import json
import logging
from google import genai
from google.genai import types
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Global client
client = None

def load_gemini():
    """Initializes the Gemini client. Called by main.py."""
    global client
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY not found in environment variables. Gemini SDK will NOT be initialized.")
        return
    
    try:
        # Initialize client. The SDK uses GOOGLE_API_KEY if passed, 
        # or GEMINI_API_KEY from environment by default.
        client = genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize google-genai Client: {str(e)}")

PROMPT_TEMPLATE = """You are a pricing risk analysis engine.

Rules:
* All risk scores must be between 0 and 1
* Be consistent and deterministic
* Consider combined effects (e.g., rain + strike = higher risk)
* Do NOT hallucinate missing data
* Keep reasoning short (1-2 lines)
* Output STRICT JSON only

Input:
Weather:
* Rainfall: {rainfall_mm}
* Temperature: {temperature}
* Extreme Alert: {extreme_alert}
* Condition: {condition}

News Summary:
{news_summary}

Outages:
* Count: {outage_count}
* Avg Duration: {outage_duration}

Output JSON:
{{
"weather_risk": number,
"news_risk": number,
"outage_risk": number,
"reason": "short explanation"
}}"""

def analyze_risk(weather: Dict[str, Any], news_summary: str, outages: Dict[str, Any]) -> Dict[str, Any]:
    global client
    if client is None:
        load_gemini()
        
    prompt = PROMPT_TEMPLATE.format(
        rainfall_mm=weather.get("rainfall_mm", 0),
        temperature=weather.get("temperature", 0),
        extreme_alert=weather.get("extreme_alert", False),
        condition=weather.get("condition", ""),
        news_summary=news_summary,
        outage_count=outages.get("count", 0),
        outage_duration=outages.get("avg_duration", 0.0)
    )

    fallback = {
        "weather_risk": 0.5,
        "news_risk": 0.5,
        "outage_risk": 0.5,
        "reason": "Fallback due to generic problem or parsing error"
    }

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
            )
        )
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback handling: Try extracting JSON from text block if markdown exists
            text = response.text.strip()
            if text.startswith("```json"):
                text = text.replace("```json", "", 1).strip()
            if text.endswith("```"):
                text = text[:text.rfind("```")].strip()
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from Gemini response: {response.text}")
                return fallback
                
    except Exception as e:
        logger.error(f"Exception during LLM analysis: {str(e)}")
        return fallback

def test_gemini_connection() -> bool:
    global client
    if client is None:
        load_gemini()
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents="hello"
        )
        return bool(response.text)
    except Exception as e:
        logger.error(f"Gemini connection test failed: {str(e)}")
        return False
