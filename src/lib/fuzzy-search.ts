const SEARCH_SEPARATOR_PATTERN = /[^a-z0-9]+/g;

export interface FuzzySearchValue {
  normalizedText: string;
  tokens: string[];
}

export function normalizeFuzzySearchText(value: string) {
  return value.toLowerCase().replace(SEARCH_SEPARATOR_PATTERN, " ").trim();
}

export function createFuzzySearchValue(value: string): FuzzySearchValue {
  const normalizedText = normalizeFuzzySearchText(value);

  return {
    normalizedText,
    tokens: normalizedText.split(/\s+/).filter(Boolean),
  };
}

function getBestTokenMatch(queryToken: string, searchableTokens: string[]) {
  let bestScore = 0;
  let bestIndex = -1;

  searchableTokens.forEach((token, index) => {
    const score =
      token === queryToken
        ? 120
        : token.startsWith(queryToken)
          ? 90
          : token.includes(queryToken)
            ? 60
            : 0;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return { index: bestIndex, score: bestScore };
}

function getFuzzySearchValue(
  value: FuzzySearchValue | string,
): FuzzySearchValue {
  return typeof value === "string" ? createFuzzySearchValue(value) : value;
}

export function getFuzzySearchScore(
  searchable: FuzzySearchValue | string,
  query: FuzzySearchValue | string,
) {
  const searchableValue = getFuzzySearchValue(searchable);
  const queryValue = getFuzzySearchValue(query);

  if (!queryValue.normalizedText) {
    return 1;
  }

  let score = 0;
  const tokenPositions: number[] = [];

  if (searchableValue.normalizedText.startsWith(queryValue.normalizedText)) {
    score += 240;
  } else if (
    searchableValue.normalizedText.includes(queryValue.normalizedText)
  ) {
    score += 180;
  }

  for (const queryToken of queryValue.tokens) {
    const tokenMatch = getBestTokenMatch(queryToken, searchableValue.tokens);

    if (tokenMatch.score === 0) {
      return null;
    }

    score += tokenMatch.score;
    tokenPositions.push(tokenMatch.index);
  }

  const isInQueryOrder = tokenPositions.every(
    (position, index) => index === 0 || position > tokenPositions[index - 1],
  );

  if (isInQueryOrder) {
    score += 80;
    score += Math.max(
      0,
      24 - (tokenPositions[tokenPositions.length - 1] - tokenPositions[0]),
    );
  }

  return score;
}
