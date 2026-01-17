import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../start_data.json');

const NEW_IDIOMS = {
    "CONC_02": [ // The Summit of Joy (Needs 1)
        {
            language: "Persian",
            script: "در پوست خود نگنجیدن",
            transliteration: "Dar poost-e khod nagonjidan",
            literal_translation: "Not fitting in one's own skin",
            origin_story: "You are so expanded by happiness that your physical body cannot contain you.",
            usage_level: "Common / Poetic",
            risk_level: "Safe",
            geolocation: { lat: 35.6892, lng: 51.3890 },
            historical_period: "Classical Persian",
            usage_example: { native: "When he heard the news, he didn't fit in his own skin.", translation: "He was bursting with joy." },
            literature_reference: { source: "Persian Literature", context: "Commonly used in poetry and prose to describe ecstatic joy." },
            voting: { resonance: 88, accuracy: 95 }
        }
    ],
    "CONC_05": [ // The Chaos of Activity (Needs 2)
        {
            language: "Russian",
            script: "Крутиться как белка в колесе",
            transliteration: "Krutitsya kak belka v koles",
            literal_translation: "Spinning like a squirrel in a wheel",
            origin_story: "Visualizes pointless, frantic energy that goes nowhere.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 55.7558, lng: 37.6173 },
            historical_period: "19th Century",
            usage_example: { native: "I am spinning like a squirrel in a wheel.", translation: "I'm extremely busy but getting nowhere." },
            literature_reference: { source: "Krylov's Fables", context: "Used to describe frantic but often unproductive activity." },
            voting: { resonance: 85, accuracy: 90 }
        },
        {
            language: "Turkish",
            script: "İki ayağı bir pabuca girmek",
            transliteration: "Iki ayagi bir pabuca girmek",
            literal_translation: "Trying to fit two feet into one shoe",
            origin_story: "The panic of trying to do too much in too little space/time.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 41.0082, lng: 28.9784 },
            historical_period: "Ottoman Era",
            usage_example: { native: "Patron gelince iki ayağım bir pabuca girdi.", translation: "When the boss arrived, I panicked (two feet in one shoe)." },
            literature_reference: { source: "Oral Tradition", context: "Describes a state of panic or rushed activity." },
            voting: { resonance: 82, accuracy: 88 }
        }
    ],
    "CONC_06": [ // The Inescapable Nature (Needs 1)
        {
            language: "Swahili",
            script: "Mwana wa nyoka ni nyoka",
            transliteration: "Mwana wa nyoka ni nyoka",
            literal_translation: "The child of a snake is a snake",
            origin_story: "Nature is inherited. You cannot teach a snake not to be a snake.",
            usage_level: "Proverbial",
            risk_level: "Safe",
            geolocation: { lat: -6.1659, lng: 39.2026 }, // Zanzibar
            historical_period: "Traditional",
            usage_example: { native: "Don't trust him; mwana wa nyoka ni nyoka.", translation: "The apple doesn't fall far from the tree." },
            literature_reference: { source: "Swahili Methali", context: "A warning that bad traits are inherited and unchangeable." },
            voting: { resonance: 90, accuracy: 92 }
        }
    ],
    "CONC_HASTE": [ // The Paradox of Haste (Needs 2)
        {
            language: "Swahili",
            script: "Haraka haraka haina baraka",
            transliteration: "Haraka haraka haina baraka",
            literal_translation: "Hurry hurry has no blessing",
            origin_story: "Does not just say haste is bad, but that it lacks 'Baraka' (divine blessing/success).",
            usage_level: "UBIQUITOUS",
            risk_level: "Safe",
            geolocation: { lat: -4.0435, lng: 39.6682 }, // Mombasa
            historical_period: "Traditional",
            usage_example: { native: "Pole pole bwana, haraka haraka haina baraka.", translation: "Slowly sir, haste has no blessing." },
            literature_reference: { source: "Swahili Methali", context: "The most famous Swahili proverb, teaching patience and deliberation." },
            voting: { resonance: 98, accuracy: 100 }
        },
        {
            language: "Russian",
            script: "Тише едешь, дальше будешь",
            transliteration: "Tishe yedesh', dal'she budesh'",
            literal_translation: "Ride quieter/slower, you will get further",
            origin_story: "Travel wisdom. Reckless riding breaks wheels. Steady riding arrives.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 59.9343, lng: 30.3351 },
            historical_period: "Traditional",
            usage_example: { native: "Don't rush the project. Tishe yedesh...", translation: "Slow and steady wins the race." },
            literature_reference: { source: "Russian Folk Wisdom", context: "Advocates for caution and steady progress over impulsive speed." },
            voting: { resonance: 92, accuracy: 95 }
        }
    ],
    "CONC_PATIENCE": [ // The Art of Patience (Needs 2)
        {
            language: "Persian",
            script: "صبر تلخ است ولیکن بر شیرین دارد",
            transliteration: "Sabr talkh ast, velikan bar-e shirin darad",
            literal_translation: "Patience is bitter, but it has sweet fruit",
            origin_story: "Waiting is painful (bitter), but the result (fruit) is worth it.",
            usage_level: "Poetic",
            risk_level: "Safe",
            geolocation: { lat: 29.5926, lng: 52.5836 }, // Shiraz (Home of poets)
            historical_period: "Classical Persian",
            usage_example: { native: "Be patient. Sabr talkh ast...", translation: "Patience pays off." },
            literature_reference: { source: "Saadi / Hafiz", context: "A recurring theme in Persian Sufi poetry about spiritual endurance." },
            voting: { resonance: 94, accuracy: 96 }
        },
        {
            language: "Vietnamese",
            script: "Có công mài sắt, có ngày nên kim",
            transliteration: "Co cong mai sat, co ngay nen kim",
            literal_translation: "If you have the effort to grind iron, one day it will become a needle",
            origin_story: "Grinding a massive iron bar down to a tiny needle takes a lifetime of patience.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 21.0285, lng: 105.8542 },
            historical_period: "Traditional",
            usage_example: { native: "Keep studying. Co cong mai sat...", translation: "Hard work pays off." },
            literature_reference: { source: "Vietnamese Folk", context: "Teaches persistence and the value of hard work over time." },
            voting: { resonance: 88, accuracy: 90 }
        }
    ],
    "CONC_EMPTY": [ // The Noise of Emptiness (Needs 2)
        {
            language: "Turkish",
            script: "Boş teneke çok ses çıkarır",
            transliteration: "Bos teneke cok ses cikarir",
            literal_translation: "An empty tin can makes much noise",
            origin_story: "Industrial version of the empty vessel. Tin cans rattle loudly when kicked if empty.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 39.9334, lng: 32.8597 },
            historical_period: "Modern",
            usage_example: { native: "He says he is the best, but bos teneke cok ses cikarir.", translation: "He's all talk." },
            literature_reference: { source: "Oral Tradition", context: "Critique of superficiality." },
            voting: { resonance: 85, accuracy: 89 }
        },
        {
            language: "Russian",
            script: "Пустая бочка пуще гремит",
            transliteration: "Pustaya bochka pushche gremit",
            literal_translation: "An empty barrel rattles louder",
            origin_story: "A full barrel rolls silently. An empty one bounces and crashes.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 55.7558, lng: 37.6173 },
            historical_period: "Traditional",
            usage_example: { native: "Ignore his threats. Pustaya bochka...", translation: "Empty vessels make the most noise." },
            literature_reference: { source: "Russian Proverb", context: "Used to dismiss loud, boastful people." },
            voting: { resonance: 87, accuracy: 91 }
        }
    ]
};

try {
    const raw = fs.readFileSync(TARGET_FILE, 'utf8');
    const data = JSON.parse(raw);
    let addedCount = 0;

    data.concepts.forEach(c => {
        if (NEW_IDIOMS[c.id]) {
            console.log(`Enriching ${c.slug}...`);
            NEW_IDIOMS[c.id].forEach(idiom => {
                // Check for duplicates
                if (!c.idioms.find(i => i.language === idiom.language)) {
                    c.idioms.push(idiom);
                    addedCount++;
                }
            });
        }
    });

    data.metadata.version = "2.4 (Globally Enriched)";
    data.metadata.total_concepts = data.concepts.length;

    fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 4));
    console.log(`Success! Added ${addedCount} new idioms.`);

} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
