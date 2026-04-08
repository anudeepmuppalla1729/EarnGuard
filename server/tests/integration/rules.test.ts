import { describe, it, expect } from '@jest/globals';
import { computeNewsRiskProlog } from '../../src/workers/rules';

describe('Prolog Intelligence: Native Disruption Tests', () => {

    it('Should return 0.9 for direct weather extreme terms dynamically matched', async () => {
        const risk = await computeNewsRiskProlog("A massive CYCLONE is hitting the dark store area.");
        expect(risk).toBe(0.9);
    });

    it('Should return 0.8 for human riot logic correctly identified', async () => {
        const risk = await computeNewsRiskProlog("Workers announced a strike blocking operations.");
        expect(risk).toBe(0.8);
    });

    it('Should securely drop safely to 0.0 for unrelated news', async () => {
        const risk = await computeNewsRiskProlog("Startup raises 10 million in funding today.");
        expect(risk).toBe(0.0);
    });

    it('Should pick the MAX risk if multiple disruption signals blend', async () => {
        const risk = await computeNewsRiskProlog("Due to heavy traffic and an accident, delivery is slow. Also there is a massive flood.");
        expect(risk).toBe(0.9); // flood beats traffic (0.5) and accident (0.6)
    });

});
