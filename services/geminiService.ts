
import { GoogleGenAI, Type } from "@google/genai";
import { RaceState, RaceConfig, Driver, Circuit, StrategyOption } from "../types";

const initGenAI = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fetchRaceConditions = async (circuit: Circuit, date: Date): Promise<{ airTemp: number, trackTemp: number, rainProb: number }> => {
  const ai = initGenAI();
  // Sensible defaults based on average F1 conditions, used only if API completely fails
  const fallback = { airTemp: 22, trackTemp: 34, rainProb: 0.1 };

  if (!ai) return fallback;

  try {
    // Format date specifically for the circuit's local timezone to ensure accurate weather search
    const dateStr = date.toLocaleString('en-US', { 
        timeZone: circuit.timezone, 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
    });
    
    const prompt = `Perform a Google Search to find the ACTUAL weather conditions or forecast for the ${circuit.name} in ${circuit.location}, ${circuit.country} at this specific time: ${dateStr}.
    
    I need real data:
    1. Air Temperature (Celsius).
    2. Probability of Precipitation (0.0 to 1.0).

    If the date is in the future, find the most reliable forecast.
    If the date is in the past, find the historical weather record for that hour.
    
    Do not hallucinate or randomize. Return the search result directly.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            airTemp: { type: Type.NUMBER, description: "The specific air temperature in Celsius found via search." },
            rainProb: { type: Type.NUMBER, description: "The specific rain probability (0.0 to 1.0) found via search." },
          },
          required: ["airTemp", "rainProb"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    const airTemp = data.airTemp !== undefined ? data.airTemp : fallback.airTemp;
    const rainProb = data.rainProb !== undefined ? data.rainProb : fallback.rainProb;

    // Calculate Track Temp based on Physics Heuristics rather than random
    // Asphalt has low specific heat capacity and absorbs solar radiation.
    // Dry/Sunny: Track ~10-15°C > Air
    // Overcast: Track ~5-8°C > Air
    // Wet/Rain: Evaporative cooling keeps Track ~ Air Temp (0-2°C diff)
    
    let trackOffset = 12; // Default Sunny/Dry
    if (rainProb >= 0.5) {
        trackOffset = 1; // Raining / Wet
    } else if (rainProb >= 0.2) {
        trackOffset = 6; // Likely Cloudy/Overcast
    }

    const trackTemp = airTemp + trackOffset;

    return {
      airTemp,
      trackTemp,
      rainProb
    };

  } catch (e: any) {
    if (e.message?.includes('429') || e.status === 429) {
       console.warn("Weather API Quota Exceeded. Using historical baseline.");
    } else {
       console.warn("Weather API Unavailable or Parse Error, using fallback.", e);
    }
    return fallback;
  }
};

export const generateStrategyExplanation = async (
  raceState: RaceState,
  raceConfig: RaceConfig,
  heroDriver: Driver,
  simResult: { winProb: number, podiumProb: number, avgFinish: number },
  strategies: StrategyOption[]
): Promise<string> => {
  const ai = initGenAI();
  
  // Robust Fallback Construction
  const recommended = strategies[0];
  const fallbackExplanation = `**SYSTEM NOTICE**: AI Strategy Link Offline (Quota/Network).\n\n**Calculated Optimal Path**: ${recommended.name}.\n\nMonte Carlo simulations (${simResult.winProb.toFixed(1)}% Win Prob) indicate this strategy offers the best balance of pace and tyre life. Box around Lap ${recommended.pitLap} for ${recommended.targetCompound}. Monitor gaps to traffic exiting the pits.`;

  if (!ai) return fallbackExplanation;

  const prompt = `
    You are the Head of Race Strategy for ${heroDriver.team}. The car is PITWALL.PRO optimized.
    
    **Current Status:**
    - Driver: ${heroDriver.name} (P${heroDriver.position})
    - Circuit: ${raceConfig.trackName}
    - Lap: ${raceState.currentLap} / ${raceConfig.totalLaps}
    - Current Tyre: ${heroDriver.currentTyre} (Age: ${heroDriver.tyreAge})
    - Weather: ${raceState.rainProbability > 0.4 ? 'RAIN IMMINENT' : 'Dry'} (${(raceState.rainProbability * 100).toFixed(0)}% chance)

    **Simulated Outcomes:**
    - Win Probability: ${simResult.winProb.toFixed(1)}%
    - Podium Probability: ${simResult.podiumProb.toFixed(1)}%
    
    **Strategy Options:**
    ${strategies.map(s => `- ${s.name}: ${s.description}`).join('\n')}

    **Instructions:**
    1. **WARNING:** If rain probability is > 40% or changed significantly, issue a WEATHER ALERT immediately at the start.
    2. **PIT WINDOW:** Explicitly state the "Perfect Pit Window" (e.g., "Box Laps 24-26").
    3. **DECISION:** Recommend one strategy clearly. Explain *why* based on tire deg or traffic.
    4. Keep it brief, radio-style, professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        maxOutputTokens: 300, 
      }
    });
    return response.text || fallbackExplanation;
  } catch (error: any) {
    if (error.message?.includes('429') || error.status === 429) {
        console.warn("Strategy API Quota Exceeded. Returning calculated fallback.");
    }
    return fallbackExplanation;
  }
};
