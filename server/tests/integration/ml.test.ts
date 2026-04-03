import { describe, it, expect, jest } from '@jest/globals';

// We explicitly DO NOT mock global.fetch here so we can hit the running Python AI natively!
describe('Live ML Pipeline Scenario Stress Tests', () => {
    
    // Increase timeout heavily because Gemini takes 3-5 seconds natively generating structured answers!
    jest.setTimeout(30000); 

    it('Scenario 1: Cyclone & Severe Weather natively induces extreme weekly premium adjustments', async () => {
        const weekRes = await fetch(`http://127.0.0.1:8000/calculate-weekly-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city_id: 1, 
                city: 'Hyderabad',
                base_price: 150.0,
                weather: {
                    rainfall_mm: 500.0,
                    temperature: 15.0,
                    extreme_alert: true,
                    condition: "severe cyclone and massive flooding"
                },
                news_summary: "Red Alert, NDRF deployed across Hyderabad. Roads washed away.",
                outages: { count: 8, avg_duration: 5.5 }
            })
        });

        expect(weekRes.ok).toBe(true);
        const data = await weekRes.json();
        
        console.log("🌪️ CYCLONE ML RESULTS ➔", JSON.stringify(data, null, 2));
        
        // Ensure Gemini correctly calculated a massive risk hike!
        expect(data.weekly_addition).toBeGreaterThan(45.0);
        expect(data.reason).toBeDefined();
    });

    it('Scenario 2: Transport Strikes & City Curfews natively map massive external disruption risk smoothly', async () => {
        const weekRes = await fetch(`http://127.0.0.1:8000/calculate-weekly-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city_id: 1, 
                city: 'Hyderabad',
                base_price: 150.0,
                weather: {
                    rainfall_mm: 0.0,
                    temperature: 30.0,
                    extreme_alert: false,
                    condition: "clear"
                },
                news_summary: "Section 144 Curfew imposed dynamically. Mass transport strikes causing burning buses. Delivery blocked.",
                outages: { count: 0, avg_duration: 0 }
            })
        });

        expect(weekRes.ok).toBe(true);
        const data = await weekRes.json();
        
        console.log("🛑 STRIKES & CURFEW ML RESULTS ➔", JSON.stringify(data, null, 2));
        
        // Ensure Gemini decoupled Weather and focused purely on Human Disruptions!
        expect(data.weekly_addition).toBeGreaterThan(20.0);
        expect(data.reason).toBeDefined();
    });
});
