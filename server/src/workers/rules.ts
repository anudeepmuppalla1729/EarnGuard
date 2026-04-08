// @ts-expect-error - no official types for tau-prolog
import pl from 'tau-prolog';

// Prolog Rules Base for Q-Commerce Disruptions
const program = `
    % Knowledge Base: disruption_score(Event, Score).
    disruption_score(flood, 0.9).
    disruption_score(earthquake, 0.9).
    disruption_score(cyclone, 0.9).
    disruption_score(hurricane, 0.9).
    disruption_score(strike, 0.8).
    disruption_score(protest, 0.8).
    disruption_score(riot, 0.8).
    disruption_score(bandh, 0.8).
    disruption_score(accident, 0.6).
    disruption_score(traffic, 0.5).
    disruption_score(waterlogging, 0.7).
    disruption_score(fire, 0.7).
    disruption_score(roadblock, 0.7).

    % Rules to check if any of these events are in the list of words.
    % max_risk(WordsList, MaxRisk)
    
    get_risk(Word, Risk) :- disruption_score(Word, Risk), !.
    get_risk(_, 0.0). % Default fallback

    list_risks([], []).
    list_risks([Word|Tail], [Risk|RiskTail]) :-
        get_risk(Word, Risk),
        list_risks(Tail, RiskTail).

    max_in_list([Max], Max).
    max_in_list([Head|Tail], Max) :-
        max_in_list(Tail, TailMax),
        (Head > TailMax -> Max = Head ; Max = TailMax).

    calculate_max_risk([], 0.0).
    calculate_max_risk(Words, MaxRisk) :-
        list_risks(Words, Risks),
        max_in_list(Risks, MaxRisk).
`;

export const computeNewsRiskProlog = (headline: string): Promise<number> => {
    return new Promise((resolve) => {
        const session = pl.create(500000);
        
        session.consult(program, {
            success: function() {
                // Parse headline into array of lowercase words (alphanumeric only)
                const words = headline.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
                if (words.length === 0) return resolve(0.0);

                // Convert JS array to Prolog list syntax mapping single quotes for strict atoms: ['word1', 'word2', ...]
                const prologList = '[' + words.map(w => "'" + w + "'").join(',') + ']';
                const query = `calculate_max_risk(${prologList}, MaxRisk).`;

                session.query(query, {
                    success: function() {
                        session.answer({
                            success: function(answer: any) {
                                let val = session.format_answer(answer);
                                // Expected format: MaxRisk = 0.8.
                                const match = val.match(/MaxRisk = (0\.[0-9]+|0|1)/);
                                if (match) {
                                    resolve(parseFloat(match[1]));
                                } else {
                                    resolve(0.0);
                                }
                            },
                            error: function(_err: any) {
                                resolve(0.0);
                            },
                            fail: function() {
                                resolve(0.0);
                            },
                            limit: function() {
                                resolve(0.0);
                            }
                        });
                    },
                    error: function(_err: any) {
                        resolve(0.0);
                    }
                });
            },
            error: function(_err: any) {
                resolve(0.0);
            }
        });
    });
};
