const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TOKENS_JSON_PATH = path.join(ROOT_DIR, 'assets', 'WebAudX-design-tokens.tokens.json');
const TOKENS_CSS_PATH = path.join(ROOT_DIR, 'src', 'tokens.css');

test('Typography & Font Sizes Test Suite', async (t) => {

  const rawTokens = JSON.parse(fs.readFileSync(TOKENS_JSON_PATH, 'utf8'));
  const tokensCss = fs.readFileSync(TOKENS_CSS_PATH, 'utf8');

  // Official font sizes from WebAudX-design-tokens.tokens.json
  const headingTokens = rawTokens.font['global tokens'].headings;
  const bodyTokens = rawTokens.font['global tokens'].body;

  const officialHeadingSizes = {
    'h-1': headingTokens['h-1'].value.fontSize, // 138
    'h-2': headingTokens['h-2'].value.fontSize, // 98
    'h-3': headingTokens['h-3'].value.fontSize, // 70
    'h-4': headingTokens['h-4'].value.fontSize, // 50
    'h-5': headingTokens['h-5'].value.fontSize, // 36
    'h-6': headingTokens['h-6'].value.fontSize  // 26
  };

  const officialBodySizes = {
    'b-1': bodyTokens['b-1'].value.fontSize, // 18
    'b-2': bodyTokens['b-2'].value.fontSize, // 12
    'b-3': bodyTokens['b-3'].value.fontSize, // 8
    'b-4': bodyTokens['b-4'].value.fontSize  // 6
  };

  const allowedSizesPx = new Set([
    ...Object.values(officialHeadingSizes),
    ...Object.values(officialBodySizes)
  ]);

  await t.test('tokens.css accurately defines all official design system font sizes', () => {
    // Verify each heading token in tokens.css
    for (const [key, size] of Object.entries(officialHeadingSizes)) {
      const varName = `--token-font-headings-${key.replace('-', '')}-size`;
      const expectedDeclaration = `${varName}: ${size}px;`;
      assert.ok(
        tokensCss.includes(expectedDeclaration),
        `tokens.css must declare ${expectedDeclaration}`
      );
    }

    // Verify each body token in tokens.css
    for (const [key, size] of Object.entries(officialBodySizes)) {
      const varName = `--token-font-body-${key.replace('-', '')}-size`;
      const expectedDeclaration = `${varName}: ${size}px;`;
      assert.ok(
        tokensCss.includes(expectedDeclaration),
        `tokens.css must declare ${expectedDeclaration}`
      );
    }
  });

  await t.test('tokens.css strictly uses only approved font families (Montserrat and Inter)', () => {
    assert.ok(tokensCss.includes("--token-font-headings-family: 'Montserrat', sans-serif;"));
    assert.ok(tokensCss.includes("--token-font-body-family: 'Inter', sans-serif;"));
  });

  const htmlFiles = ['index.html', 'signup.html'];

  for (const file of htmlFiles) {
    await t.test(`${file} strictly uses design system font size tokens with zero hardcoded values`, () => {
      const filePath = path.join(ROOT_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Regex to extract all `font-size: <value>` declarations
      const fontSizeRegex = /font-size\s*:\s*([^;]+);/gi;
      let match;
      let count = 0;

      while ((match = fontSizeRegex.exec(content)) !== null) {
        count++;
        const value = match[1].trim();

        // 1. Must use var(--token-font-...)
        assert.ok(
          value.startsWith('var(--token-font-'),
          `In ${file}: font-size "${value}" is not using a design token variable! Line near: ${match[0]}`
        );

        // 2. Must not contain raw px, rem, em, pt values
        assert.ok(
          !/^\d+(px|rem|em|pt)/.test(value),
          `In ${file}: found hardcoded font-size "${value}"`
        );
      }

      assert.ok(count > 0, `Expected at least one font-size declaration in ${file}`);
    });
  }

  await t.test('index.html footer does not contain demo/test tooling features', () => {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    assert.ok(!content.includes('demo-bar'), 'index.html must not contain the .demo-bar container');
    assert.ok(!content.includes('Test Feature 1 Acceptance Scenarios:'), 'index.html footer must not contain test scenario text');
    assert.ok(!content.includes('id="btn-empty"'), 'index.html footer must not contain test buttons');
  });

});
