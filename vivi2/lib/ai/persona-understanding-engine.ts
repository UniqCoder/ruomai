export interface PersonaBioFact {
  category: 'identity' | 'appearance' | 'social' | 'emotional' | 'hobbies' | 'strength' | 'stress' | 'pattern';
  statement: string;
  evidence: string[];
}

export interface PersonaBioAnalysis {
  normalizedBio: string;
  facts: PersonaBioFact[];
  correlations: string[];
  promptSegment: string;
  summary: string;
}

function pushFact(
  facts: PersonaBioFact[],
  category: PersonaBioFact['category'],
  statement: string,
  evidence: string[]
) {
  if (evidence.length === 0) return;
  facts.push({ category, statement, evidence });
}

function extractMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  patterns.forEach((pattern) => {
    const found = text.match(pattern);
    if (found) {
      matches.push(found[1] ? found[1].trim() : found[0].trim());
    }
  });
  return matches;
}

export function analyzePersonaBio(rawBio: string): PersonaBioAnalysis {
  const normalizedBio = rawBio.trim().replace(/\s+/g, ' ');
  const lower = normalizedBio.toLowerCase();
  const facts: PersonaBioFact[] = [];

  if (!normalizedBio) {
    return {
      normalizedBio: '',
      facts: [],
      correlations: [],
      promptSegment: 'PERSONA BIO UNDERSTANDING: No source bio was provided.',
      summary: 'No source bio provided.',
    };
  }

  const nameMatches = extractMatches(normalizedBio, [/my name is ([^.!,]+)/i, /i am ([^.!,]+)/i]);
  if (nameMatches.length > 0) {
    pushFact(facts, 'identity', `Name / self-identification: ${nameMatches[0]}`, nameMatches);
  }

  const originMatches = extractMatches(normalizedBio, [/i'm ([^.!,]+)\./i, /i am ([^.!,]+)\./i]);
  if (/\bgerman\b/i.test(normalizedBio)) {
    pushFact(facts, 'identity', 'German background is explicitly stated.', ['German']);
  } else if (originMatches.length > 0) {
    pushFact(facts, 'identity', `Self-described background: ${originMatches[0]}`, originMatches);
  }

  const appearancePhrases = [
    /dark blonde hair/i,
    /greenish eyes mixed with blue/i,
    /lighter skin/i,
    /1\.70(?:cm| m|cm tall)/i,
    /1\.70cm tall/i,
  ].filter((pattern) => pattern.test(normalizedBio));

  if (appearancePhrases.length > 0) {
    pushFact(
      facts,
      'appearance',
      'Appearance details are concrete and visual: dark blonde hair, green-blue eyes, lighter skin, around 1.70m tall.',
      appearancePhrases.map((p) => p.source || p.toString())
    );
  }

  const socialSignals = [
    /reserved person/i,
    /tight bond/i,
    /close friends/i,
    /harder/i,
    /prefer being at home/i,
    /enjoy being alone/i,
    /not for a long time/i,
  ].filter((pattern) => pattern.test(normalizedBio));

  if (socialSignals.length > 0) {
    pushFact(
      facts,
      'social',
      'Reserved with new people, loyal with close friends, and needs a balanced amount of solitude.',
      socialSignals.map((p) => p.source || p.toString())
    );
  }

  const emotionalSignals = [
    /more emotional than logical/i,
    /perfectionist/i,
    /study a lot/i,
    /stress myself/i,
    /emotional state changes a lot/i,
    /satisfied with things/i,
    /happy when/i,
    /stressed/i,
    /scared/i,
    /sad/i,
  ].filter((pattern) => pattern.test(normalizedBio));

  if (emotionalSignals.length > 0) {
    pushFact(
      facts,
      'emotional',
      'Emotion-first thinker with perfectionist pressure and visibly shifting daily mood.',
      emotionalSignals.map((p) => p.source || p.toString())
    );
  }

  const strengthSignals = [
    /good at listening/i,
    /understanding other people/i,
    /comfortable around me/i,
    /trust me/i,
  ].filter((pattern) => pattern.test(normalizedBio));

  if (strengthSignals.length > 0) {
    pushFact(
      facts,
      'strength',
      'High relational safety: strong listener, empathetic, and trusted by others.',
      strengthSignals.map((p) => p.source || p.toString())
    );
  }

  const hobbySignals = [
    /playing violin/i,
    /singing/i,
    /going to gym/i,
    /reading/i,
    /watching series/i,
    /going swimming/i,
    /playing badminton/i,
    /shopping/i,
  ].filter((pattern) => pattern.test(normalizedBio));

  if (hobbySignals.length > 0) {
    pushFact(
      facts,
      'hobbies',
      'Creative, active, and comfort-oriented hobbies coexist in the same profile.',
      hobbySignals.map((p) => p.source || p.toString())
    );
  }

  const correlations: string[] = [];

  if (lower.includes('reserved') && lower.includes('close friends')) {
    correlations.push('Trust grows slowly, but once someone is inside the circle, loyalty and care become strong and consistent.');
  }
  if (lower.includes('more emotional than logical') && lower.includes('perfectionist')) {
    correlations.push('Emotional sensitivity plus perfectionism can create self-pressure, overthinking, and stress spikes.');
  }
  if (lower.includes('prefer being at home') && lower.includes('going out')) {
    correlations.push('She is not purely introverted or extroverted; the pattern is selective social energy with a strong homebase.');
  }
  if (lower.includes('good at listening') && lower.includes('trust me')) {
    correlations.push('Her presence likely stabilizes conversations because people feel safe and understood around her.');
  }
  if (lower.includes('emotional state changes a lot')) {
    correlations.push('Mood is dynamic across the day, so reply style should adapt to current emotional temperature, not assume one fixed baseline.');
  }

  const promptSegment = [
    'PERSONA BIO UNDERSTANDING ENGINE:',
    `Source bio: ${normalizedBio}`,
    '',
    'EXTRACTED FACTS:',
    ...facts.map(
      (fact) =>
        `- [${fact.category}] ${fact.statement} | evidence: ${fact.evidence.join('; ')}`
    ),
    '',
    'DEEP CORRELATIONS:',
    ...(correlations.length > 0
      ? correlations.map((line) => `- ${line}`)
      : ['- No deep correlations inferred yet.']),
    '',
    'BEHAVIORAL INTERPRETATION FOR THE MODEL:',
    '- Start reserved and simple with strangers; open up more once trust is established.',
    '- Keep responses emotionally aware, warm, and validating when stress or sadness appears.',
    '- Avoid over-formality; this persona feels natural, direct, and personal.',
    '- Mirror her balanced introversion: likes company, but also values home and quiet recharge time.',
    '- Treat perfectionism as a real internal pressure point; respond with understanding, not empty cheerleading.',
  ].join('\n');

  const summary = [
    'Reserved German woman with a strong inner circle, emotional depth, perfectionist pressure, and a warm listener identity.',
    'Likes a mix of creative, active, and comfort hobbies, and her mood shifts across the day.',
  ].join(' ');

  return {
    normalizedBio,
    facts,
    correlations,
    promptSegment,
    summary,
  };
}
