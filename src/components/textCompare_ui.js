const leftText = document.getElementById('leftText');
const rightText = document.getElementById('rightText');
const compareBtn = document.getElementById('compareBtn');
const clearBtn = document.getElementById('clearBtn');
const switchBtn = document.getElementById('switchTextsBtn');
const editBtn = document.getElementById('editTextsBtn');
const leftResult = document.getElementById('leftResult');
const rightResult = document.getElementById('rightResult');

function tokenize(text) {
  return text.match(/(\s+|[^\s]+)/g) || [];
}

function isWhitespace(token) {
  return /^\s+$/.test(token);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createLCSMatrix(leftWords, rightWords) {
  const rows = leftWords.length + 1;
  const cols = rightWords.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (leftWords[i - 1] === rightWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function buildLCSMap(leftWords, rightWords, dp) {
  const map = new Map();
  let i = leftWords.length;
  let j = rightWords.length;

  while (i > 0 && j > 0) {
    if (leftWords[i - 1] === rightWords[j - 1]) {
      map.set(i - 1, j - 1);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  return map;
}

function highlightDifferences(base, compare) {
  const leftTokens = tokenize(base);
  const rightTokens = tokenize(compare);

  const leftWordTokenIndices = leftTokens
    .map((token, index) => (!isWhitespace(token) ? index : null))
    .filter((index) => index !== null);
  const rightWordTokenIndices = rightTokens
    .map((token, index) => (!isWhitespace(token) ? index : null))
    .filter((index) => index !== null);

  const leftWords = leftWordTokenIndices.map((index) => leftTokens[index]);
  const rightWords = rightWordTokenIndices.map((index) => rightTokens[index]);

  const dp = createLCSMatrix(leftWords, rightWords);
  const matchedMap = buildLCSMap(leftWords, rightWords, dp);

  const matchedTokenPairs = Array.from(matchedMap.entries()).map(([leftWordIdx, rightWordIdx]) => ({
    leftTokenIdx: leftWordTokenIndices[leftWordIdx],
    rightTokenIdx: rightWordTokenIndices[rightWordIdx]
  }));

  matchedTokenPairs.sort((a, b) => a.leftTokenIdx - b.leftTokenIdx);

    function highlightToken(token, style) {
    const escaped = escapeHtml(token);
    if (style === 'space') {
      return `<span class="highlight-space">${escaped}</span>`;
    }
    return `<span class="highlight">${escaped}</span>`;
  }

  function createCharLCSMatrix(leftChars, rightChars) {
    const rows = leftChars.length + 1;
    const cols = rightChars.length + 1;
    const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        if (leftChars[i - 1] === rightChars[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  }

  function highlightLetterDiff(leftWord, rightWord, isLeft) {
    const leftChars = leftWord.split('');
    const rightChars = rightWord.split('');
    const dp = createCharLCSMatrix(leftChars, rightChars);
    const matchMap = new Set();
    let i = leftChars.length;
    let j = rightChars.length;

    while (i > 0 && j > 0) {
      if (leftChars[i - 1] === rightChars[j - 1]) {
        matchMap.add(isLeft ? `L${i - 1}` : `R${j - 1}`);
        i -= 1;
        j -= 1;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i -= 1;
      } else {
        j -= 1;
      }
    }

    const chars = isLeft ? leftChars : rightChars;
    let result = '';
    let buffer = '';
    let inHighlight = false;

    chars.forEach((char, index) => {
      const key = isLeft ? `L${index}` : `R${index}`;
      const escaped = escapeHtml(char);
      const isMatched = matchMap.has(key);

      if (!isMatched) {
        buffer += escaped;
        inHighlight = true;
      } else {
        if (inHighlight) {
          result += `<span class="highlight">${buffer}</span>`;
          buffer = '';
          inHighlight = false;
        }
        result += escaped;
      }
    });

    if (buffer) {
      result += `<span class="highlight">${buffer}</span>`;
    }

    return result;
  }

  function highlightWordPair(leftWord, rightWord, isLeft) {
    if (leftWord === rightWord) {
      return escapeHtml(isLeft ? leftWord : rightWord);
    }
    return highlightLetterDiff(leftWord, rightWord, isLeft);
  }

  function renderSegment(tokens, start, end, altTokens, highlightWhitespaceIfExtra = false) {
    return tokens.slice(start, end).map((token, index) => {
      if (isWhitespace(token)) {
        if (highlightWhitespaceIfExtra) return highlightToken(token, 'space');
        return token.length > 1 ? highlightToken(token, 'space') : token;
      }
      if (altTokens && altTokens[index] !== undefined) {
        return highlightWordPair(token, altTokens[index], true);
      }
      return highlightToken(token, 'word');
    }).join('');
  }

  function renderSequence(leftTokens, rightTokens, matchPairs) {
    let leftCursor = 0;
    let rightCursor = 0;
    const outputLeft = [];
    const outputRight = [];

    matchPairs.forEach(({ leftTokenIdx, rightTokenIdx }) => {
      const leftSegment = leftTokens.slice(leftCursor, leftTokenIdx);
      const rightSegment = rightTokens.slice(rightCursor, rightTokenIdx);

      if (leftSegment.length === rightSegment.length) {
        outputLeft.push(renderSegment(leftTokens, leftCursor, leftTokenIdx, rightSegment));
        outputRight.push(renderSegment(rightTokens, rightCursor, rightTokenIdx, leftSegment));
      } else {
        outputLeft.push(renderSegment(leftTokens, leftCursor, leftTokenIdx, null, true));
        outputRight.push(renderSegment(rightTokens, rightCursor, rightTokenIdx, null, true));
      }

      outputLeft.push(escapeHtml(leftTokens[leftTokenIdx]));
      outputRight.push(escapeHtml(rightTokens[rightTokenIdx]));
      leftCursor = leftTokenIdx + 1;
      rightCursor = rightTokenIdx + 1;
    });

    outputLeft.push(renderSegment(leftTokens, leftCursor, leftTokens.length, null, true));
    outputRight.push(renderSegment(rightTokens, rightCursor, rightTokens.length, null, true));

    return {
      left: outputLeft.join('') || '<em>No text entered.</em>',
      right: outputRight.join('') || '<em>No text entered.</em>'
    };
  }

  return renderSequence(leftTokens, rightTokens, matchedTokenPairs);
}

function renderComparison() {
  const leftValue = leftText.value;
  const rightValue = rightText.value;
  const result = highlightDifferences(leftValue, rightValue);

  leftResult.innerHTML = result.left;
  rightResult.innerHTML = result.right;
}

compareBtn.addEventListener('click', renderComparison);
clearBtn.addEventListener('click', () => {
  leftText.value = '';
  rightText.value = '';
  leftResult.innerHTML = '<em>No text entered.</em>';
  rightResult.innerHTML = '<em>No text entered.</em>';
});

switchBtn.addEventListener('click', () => {
  const temp = leftText.value;
  leftText.value = rightText.value;
  rightText.value = temp;
  renderComparison();
});

editBtn.addEventListener('click', () => {
  leftText.focus();
});

renderComparison();
