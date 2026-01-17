import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGINAL_FILE = path.join(__dirname, '../original_start_data.json');
const TARGET_FILE = path.join(__dirname, '../start_data.json');

// The V2 Additions (New Concepts + Extra Idioms for overlaps)
const V2_CONCEPTS = [
    {
        id: "CONC_HASTE",
        slug: "paradox-of-haste",
        universal_concept: "The Paradox of Haste",
        emoji: "🏃💨",
        idioms: [
            {
                language: "Italian",
                script: "La gatta frettolosa fece i gattini ciechi",
                transliteration: "La gatta frettolosa...",
                literal_translation: "The hasty cat gave birth to blind kittens",
                origin_story: "Nature cannot be rushed. Forcing birth leads to blindness (kittens born early).",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 41.8719, lng: 12.5674 },
                historical_period: "Traditional",
                usage_example: { native: "La gatta frettolosa...", translation: "Haste makes waste." },
                literature_reference: { source: "Italian Folklore", context: "Patience." },
                voting: { resonance: 88, accuracy: 98 }
            },
            {
                language: "Japanese",
                script: "急がば回れ",
                transliteration: "Isogaba maware",
                literal_translation: "If you are in a hurry, go around",
                origin_story: "Crossing Lake Biwa: the direct wet route was dangerous. The long land route was safer/faster.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 35.0116, lng: 135.7681 },
                historical_period: "15th Century",
                usage_example: { native: "Isogaba maware.", translation: "Slow is smooth, smooth is fast." },
                literature_reference: { source: "Renga Poem", context: "Strategy." },
                voting: { resonance: 92, accuracy: 100 }
            },
            {
                language: "Estonian",
                script: "Tasa sõuad, kaugele jõuad",
                transliteration: "Tasa souad, kaugele jouad",
                literal_translation: "Row slowly, and you will reach far",
                origin_story: "A maritime proverb. Speed exhausts the rower; rhythm and endurance conquer the sea.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 58.5953, lng: 25.0136 },
                historical_period: "Traditional",
                usage_example: { native: "Ära kiirusta...", translation: "Don't rush." },
                literature_reference: { source: "Oral Tradition", context: "Endurance." },
                voting: { resonance: 75, accuracy: 95 }
            }
        ],
        image: "/assets/concepts/haste_abstract.png"
    },
    {
        id: "CONC_PATIENCE",
        slug: "art-of-patience",
        universal_concept: "The Art of Patience",
        emoji: "💧",
        idioms: [
            {
                language: "Hindi",
                script: "बूंद बूंद से सागर भरता है",
                transliteration: "Boond boond se sagar barta hai",
                literal_translation: "Drop by drop the ocean fills",
                origin_story: "Even the infinite ocean is made of single drops. Small efforts compound.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 19.0760, lng: 72.8777 },
                historical_period: "Traditional",
                usage_example: { native: "Boond boond se sagar...", translation: "Keep going, step by step." },
                literature_reference: { source: "Oral Tradition", context: "Persistence." },
                voting: { resonance: 91, accuracy: 95 }
            },
            {
                language: "Japanese",
                script: "塵も積もれば山となる",
                transliteration: "Chiri mo tsumoreba yama to naru",
                literal_translation: "Even dust, when piled up, becomes a mountain",
                origin_story: "Transforms the 'worthless' (dust) into the 'majestic' (mountain) through time.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 35.3606, lng: 138.7274 },
                historical_period: "Traditional",
                usage_example: { native: "Chiri mo tsumoreba...", translation: "Every little bit counts." },
                literature_reference: { source: "Koan/Proverb", context: "Discipline." },
                voting: { resonance: 89, accuracy: 92 }
            },
            {
                language: "Latin",
                script: "Gutta cavat lapidem",
                transliteration: "Gutta cavat lapidem",
                literal_translation: "The drop hollows the stone",
                origin_story: "Persistence conquers hardness not by strength, but by consistency.",
                usage_level: "Classic",
                risk_level: "Safe",
                geolocation: { lat: 41.9028, lng: 12.4964 },
                historical_period: "Roman Era",
                usage_example: { native: "Gutta cavat lapidem.", translation: "Don't give up." },
                literature_reference: { source: "Ovid", context: "Epistulae ex Ponto." },
                voting: { resonance: 95, accuracy: 100 }
            }
        ],
        image: "/assets/concepts/patience_abstract.png"
    },
    {
        id: "CONC_EMPTY",
        slug: "noise-of-emptiness",
        universal_concept: "The Noise of Emptiness",
        emoji: "🥁",
        idioms: [
            {
                language: "Hindi",
                script: "अधजल गगरी छलकत जाए",
                transliteration: "Adhjal gagri chhalakat jaye",
                literal_translation: "A half-filled pot spills the most",
                origin_story: "Full vessels are stable. Half-empty/shallow ones are unstable and noisy.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 25.3176, lng: 82.9739 },
                historical_period: "Medieval",
                usage_example: { native: "He's just an Adhjal gagri...", translation: "He talks big but knows little." },
                literature_reference: { source: "Kabir", context: "Bhakti movement." },
                voting: { resonance: 88, accuracy: 92 }
            },
            {
                language: "Spanish",
                script: "Mucho ruido y pocas nueces",
                transliteration: "Mucho ruido y pocas nueces",
                literal_translation: "Much noise and few walnuts",
                origin_story: "A big cracking sound that yields an empty shell. High promise, zero return.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 40.4168, lng: -3.7038 },
                historical_period: "Classic",
                usage_example: { native: "Mucho ruido...", translation: "All talk, no action." },
                literature_reference: { source: "Spanish Proverb", context: "Disappointment." },
                voting: { resonance: 85, accuracy: 88 }
            },
            {
                language: "Bengali",
                script: "খালি কলসি বাজে বেশি",
                transliteration: "Khali kolshi baje beshi",
                literal_translation: "Empty pitchers sound the most",
                origin_story: "If you tap a full vessel, it is dull. An empty one rings loud. Refers to empty talkers.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 22.5726, lng: 88.3639 },
                historical_period: "Traditional",
                usage_example: { native: "Ignore his bragging...", translation: "Empty pitchers sound most." },
                literature_reference: { source: "Oral Tradition", context: "Folk wisdom." },
                voting: { resonance: 88, accuracy: 95 }
            }
        ],
        image: "/assets/concepts/empty_vessels_abstract.png"
    },
    {
        id: "CONC_PEARLS",
        slug: "tragedy-of-value",
        universal_concept: "The Tragedy of Unappreciated Value",
        emoji: "💎",
        idioms: [
            {
                language: "Hindi",
                script: "बंदर क्या जाने अदरक का स्वाद",
                transliteration: "Bandar kya jaane adrak ka swad",
                literal_translation: "What does a monkey know of the taste of ginger?",
                origin_story: "Ginger is sophisticated/spicy. A monkey wants sweet fruit. He discards the valuable ginger because he can't understand it.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 25.2138, lng: 75.8648 },
                historical_period: "Traditional",
                usage_example: { native: "Bandar kya jaane...", translation: "He lacks the taste to appreciate this." },
                literature_reference: { source: "Folk Wisdom", context: "Criticism of ignorance." },
                voting: { resonance: 95, accuracy: 98 }
            },
            {
                language: "Tamil",
                script: "கழுதைக்கு தெரியுமா கற்பூர வாசனை",
                transliteration: "Kazhu-thaikku theriyuma karpoora vaasanai",
                literal_translation: "Does a donkey know the smell of camphor?",
                origin_story: "Camphor is used in holy rituals. The donkey, a symbol of brute labor, has no context for divinity or fragrance.",
                usage_level: "Common",
                risk_level: "Safe",
                geolocation: { lat: 9.9252, lng: 78.1198 },
                historical_period: "Traditional",
                usage_example: { native: "He doesn't appreciate the music...", translation: "Does a donkey know the smell of camphor?" },
                literature_reference: { source: "Oral Tradition", context: "Dravidian classic." },
                voting: { resonance: 95, accuracy: 98 }
            },
            {
                language: "English",
                script: "Casting pearls before swine",
                transliteration: "Pearls before swine",
                literal_translation: "Throwing jewelry to pigs",
                origin_story: "Biblical (Matthew 7:6). Pigs do not understand wealth; they will trample it. Do not give wisdom to those who cannot value it.",
                usage_level: "Classic",
                risk_level: "Safe",
                geolocation: { lat: 31.7683, lng: 35.2137 },
                historical_period: "Biblical",
                usage_example: { native: "Don't cast pearls to swine.", translation: "Don't waste wisdom." },
                literature_reference: { source: "Bible", context: "Warning." },
                voting: { resonance: 92, accuracy: 99 }
            }
        ],
        image: "/assets/concepts/pearls_swine_abstract.png"
    }
];

// Concepts to merge extra idioms into (overlapping keys)
const OVERLAPS = {
    "CONC_03": "CONC_HYPO", // Hypocrisy
    "CONC_04": "CONC_IMPOSSIBLE" // Impossibility
};

const EXTRA_IDIOMS = {
    "CONC_HYPO": [
        {
            language: "Jamaican Patois",
            script: "Finger neber say 'look here,' him say 'look yonder'",
            transliteration: "Finger neber say look here...",
            literal_translation: "The finger never points at itself",
            origin_story: "Physically, a finger points away. Ease of accusation vs self-reflection.",
            usage_level: "Common",
            risk_level: "Safe",
            geolocation: { lat: 18.1096, lng: -77.2975 },
            historical_period: "Traditional",
            usage_example: { native: "Why blame me...", translation: "You never blame yourself." },
            literature_reference: { source: "Caribbean Folklore", context: "" },
            voting: { resonance: 95, accuracy: 100 }
        }
    ],
    "CONC_IMPOSSIBLE": [
        {
            language: "Tamil",
            script: "ஆகாயத் தாமரை",
            transliteration: "Aagasa thamarai",
            literal_translation: "A lotus in the sky",
            origin_story: "A lotus belongs in water. A sky-lotus is a beautiful but impossible myth.",
            usage_level: "Literary",
            risk_level: "Safe",
            geolocation: { lat: 11.1271, lng: 78.6569 },
            historical_period: "Ancient",
            usage_example: { native: "It's an Aagasa thamarai.", translation: "Beautiful impossibility." },
            literature_reference: { source: "Sangam Literature", context: "" },
            voting: { resonance: 92, accuracy: 98 }
        },
        {
            language: "Hindi",
            script: "ना नौ मन तेल होगा, न राधा नाचेगी",
            transliteration: "Na nau man tel hoga, na Radha nachegi",
            literal_translation: "Neither will there be 360kg of oil, nor will Radha dance",
            origin_story: "Setting an impossible condition to ensure a task never starts.",
            usage_level: "Poetic",
            risk_level: "Safe",
            geolocation: { lat: 28.6139, lng: 77.2090 },
            historical_period: "Traditional",
            usage_example: { native: "It will happen when na nau man...", translation: "It will happen when impossible conditions are met." },
            literature_reference: { source: "Oral Tradition", context: "" },
            voting: { resonance: 80, accuracy: 85 }
        }
    ]
};

try {
    const raw = fs.readFileSync(ORIGINAL_FILE, 'utf8');
    const data = JSON.parse(raw);

    // 1. Merge Overlaps into Original Concepts
    data.concepts.forEach(c => {
        // If this concept is in our overlaps map (e.g. CONC_04)
        if (OVERLAPS[c.id] || Object.values(OVERLAPS).includes(c.id)) {
            if (c.slug.includes('hypocrisy')) {
                const extras = EXTRA_IDIOMS["CONC_HYPO"];
                extras.forEach(extra => {
                    if (!c.idioms.find(i => i.language === extra.language)) {
                        c.idioms.push(extra);
                    }
                });
            }
            if (c.slug.includes('impossibility') || c.slug.includes('impossible')) {
                const extras = EXTRA_IDIOMS["CONC_IMPOSSIBLE"];
                extras.forEach(extra => {
                    if (!c.idioms.find(i => i.language === extra.language)) {
                        c.idioms.push(extra);
                    }
                });
            }
        }
    });

    // 2. Append New V2 Concepts
    V2_CONCEPTS.forEach(newC => {
        if (!data.concepts.find(c => c.id === newC.id)) {
            data.concepts.push(newC);
        }
    });

    // 3. Update Metadata
    data.metadata.version = "2.2 (Grand Unified Behemoth)";
    data.metadata.total_concepts = data.concepts.length;
    data.metadata.description = "The Complete Collection: V1 Indic Roots + V2 Global Expansion.";

    fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 4));
    console.log(`Successfully merged. Total concepts: ${data.concepts.length}`);

} catch (err) {
    console.error("Error merging:", err);
    process.exit(1);
}
