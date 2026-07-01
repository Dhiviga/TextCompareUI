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

  const dp = createLCSMatrix(leftTokens, rightTokens);
  const matchedMap = buildLCSMap(leftTokens, rightTokens, dp);

  const matchedTokenPairs = Array.from(matchedMap.entries()).map(([leftTokenIdx, rightTokenIdx]) => ({
    leftTokenIdx,
    rightTokenIdx
  }));

  matchedTokenPairs.sort((a, b) => a.leftTokenIdx - b.leftTokenIdx);

  function highlightToken(token, style) {
    const escaped = escapeHtml(token);
    const content = style === 'space' ? escaped.replace(/ /g, '\u00A0') : escaped;

    if (style === 'space') {
      return `<span class="highlight-space">${content}</span>`;
    }
    return `<span class="highlight">${content}</span>`;
  }

  function renderSegment(tokens, start, end) {
    return tokens.slice(start, end).map((token) => {
      if (isWhitespace(token)) {
        return highlightToken(token, 'space');
      }
      return highlightToken(token, 'word');
    }).join('');
  }

  function renderSequence(tokens, matchPairs, isLeft) {
    let cursor = 0;
    const output = [];

    matchPairs.forEach(({ leftTokenIdx, rightTokenIdx }) => {
      const tokenIdx = isLeft ? leftTokenIdx : rightTokenIdx;
      output.push(renderSegment(tokens, cursor, tokenIdx));
      output.push(escapeHtml(tokens[tokenIdx]));
      cursor = tokenIdx + 1;
    });

    output.push(renderSegment(tokens, cursor, tokens.length));
    return output.join('');
  }

  return {
    left: renderSequence(leftTokens, matchedTokenPairs, true) || '<em>No text entered.</em>',
    right: renderSequence(rightTokens, matchedTokenPairs, false) || '<em>No text entered.</em>'
  };
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
