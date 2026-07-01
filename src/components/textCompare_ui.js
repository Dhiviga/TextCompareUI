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

function createLCSMatrix(leftItems, rightItems) {
  const rows = leftItems.length + 1;
  const cols = rightItems.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (leftItems[i - 1] === rightItems[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function buildLCSMap(leftItems, rightItems, dp) {
  const map = new Map();
  let i = leftItems.length;
  let j = rightItems.length;

  while (i > 0 && j > 0) {
    if (leftItems[i - 1] === rightItems[j - 1]) {
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

function renderToken(token, isHighlighted, colorClass) {
  const escaped = escapeHtml(token).replace(/ /g, '\u00A0');
  if (!isHighlighted) {
    return escaped;
  }

  if (isWhitespace(token)) {
    const classes = ['highlight-space'];
    if (colorClass) classes.push(colorClass);
    return `<span class="${classes.join(' ')}">${escaped}</span>`;
  }

  const classes = colorClass ? [colorClass] : ['highlight'];
  return `<span class="${classes.join(' ')}">${escaped}</span>`;
}

function highlightWordCaseDifference(leftWord, rightWord) {
  const leftChars = Array.from(leftWord);
  const rightChars = Array.from(rightWord);
  const maxLength = Math.max(leftChars.length, rightChars.length);

  let leftOutput = '';
  let rightOutput = '';

  for (let index = 0; index < maxLength; index += 1) {
    const leftChar = leftChars[index];
    const rightChar = rightChars[index];

    if (leftChar === undefined) {
      rightOutput += `<u class="highlight-case">${escapeHtml(rightChar)}</u>`;
    } else if (rightChar === undefined) {
      leftOutput += `<u class="highlight-case">${escapeHtml(leftChar)}</u>`;
    } else if (leftChar === rightChar) {
      leftOutput += escapeHtml(leftChar);
      rightOutput += escapeHtml(rightChar);
    } else if (leftChar.toLowerCase() === rightChar.toLowerCase()) {
      leftOutput += `<u class="highlight-case">${escapeHtml(leftChar)}</u>`;
      rightOutput += `<u class="highlight-case">${escapeHtml(rightChar)}</u>`;
    } else {
      leftOutput += escapeHtml(leftChar);
      rightOutput += escapeHtml(rightChar);
    }
  }

  return {
    left: leftOutput,
    right: rightOutput
  };
}

function highlightDifferences(base, compare) {
  if (!base && !compare) {
    return {
      left: '<em>No text entered.</em>',
      right: '<em>No text entered.</em>'
    };
  }

  const leftTokens = tokenize(base);
  const rightTokens = tokenize(compare);
  const normalizedLeftTokens = leftTokens.map((token) => (isWhitespace(token) ? token : token.toLowerCase()));
  const normalizedRightTokens = rightTokens.map((token) => (isWhitespace(token) ? token : token.toLowerCase()));

  const dp = createLCSMatrix(normalizedLeftTokens, normalizedRightTokens);
  const matchedMap = buildLCSMap(normalizedLeftTokens, normalizedRightTokens, dp);

  const matchedPairs = Array.from(matchedMap.entries())
    .map(([leftIndex, rightIndex]) => ({ leftIndex, rightIndex }))
    .sort((a, b) => a.leftIndex - b.leftIndex);

  const leftHtml = [];
  const rightHtml = [];
  let leftCursor = 0;
  let rightCursor = 0;

  matchedPairs.forEach(({ leftIndex, rightIndex }) => {
    const leftDiffTokens = leftTokens.slice(leftCursor, leftIndex);
    const rightDiffTokens = rightTokens.slice(rightCursor, rightIndex);

    if (leftDiffTokens.length || rightDiffTokens.length) {
      leftHtml.push(...leftDiffTokens.map((token) => renderToken(token, true, 'highlight-space-diff')));
      rightHtml.push(...rightDiffTokens.map((token) => renderToken(token, true, 'highlight-space-diff')));
    }

    if (leftTokens[leftIndex] && rightTokens[rightIndex] && !isWhitespace(leftTokens[leftIndex]) && !isWhitespace(rightTokens[rightIndex])) {
      if (leftTokens[leftIndex].toLowerCase() === rightTokens[rightIndex].toLowerCase() && leftTokens[leftIndex] !== rightTokens[rightIndex]) {
        const caseDiff = highlightWordCaseDifference(leftTokens[leftIndex], rightTokens[rightIndex]);
        leftHtml.push(caseDiff.left);
        rightHtml.push(caseDiff.right);
      } else if (leftTokens[leftIndex] !== rightTokens[rightIndex]) {
        leftHtml.push(renderToken(leftTokens[leftIndex], true, 'highlight-word-diff'));
        rightHtml.push(renderToken(rightTokens[rightIndex], true, 'highlight-word-diff'));
      } else {
        leftHtml.push(renderToken(leftTokens[leftIndex], false, ''));
        rightHtml.push(renderToken(rightTokens[rightIndex], false, ''));
      }
    } else {
      leftHtml.push(renderToken(leftTokens[leftIndex], false, ''));
      rightHtml.push(renderToken(rightTokens[rightIndex], false, ''));
    }

    leftCursor = leftIndex + 1;
    rightCursor = rightIndex + 1;
  });

  const leftRemainingTokens = leftTokens.slice(leftCursor);
  const rightRemainingTokens = rightTokens.slice(rightCursor);
  if (leftRemainingTokens.length || rightRemainingTokens.length) {
    leftHtml.push(...leftRemainingTokens.map((token) => renderToken(token, true, 'highlight-space-diff')));
    rightHtml.push(...rightRemainingTokens.map((token) => renderToken(token, true, 'highlight-space-diff')));
  }

  return {
    left: leftHtml.join('') || '<em>No text entered.</em>',
    right: rightHtml.join('') || '<em>No text entered.</em>'
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
leftText.addEventListener('input', renderComparison);
rightText.addEventListener('input', renderComparison);
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
