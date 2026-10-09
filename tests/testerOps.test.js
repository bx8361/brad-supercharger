import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyIgnorePatternWhitespace, buildRegexFlags, queryJsonPath, runRegex, validateXmlAgainstXsd } from '../src/testerOps.js'

const jsonPathBase = '/home/brad/projects/references/DevToys.Tools/src/DevToys.Tools.UnitTests/Tools/TestData/JsonPathTester'
const xmlBase = '/home/brad/projects/references/DevToys.Tools/src/DevToys.Tools.UnitTests/Tools/TestData/XMLTester'

test('queryJsonPath matches DevToys sample queries', () => {
  const objectJson = readFileSync(`${jsonPathBase}/sample-object.json`, 'utf8')
  const arrayJson = readFileSync(`${jsonPathBase}/sample-array.json`, 'utf8')
  assert.equal(queryJsonPath(objectJson, '$.phoneNumbers[:1].type').output, '[\n  "iPhone"\n]')
  assert.equal(queryJsonPath(objectJson, '$.TEST').output, '[]')
  assert.equal(queryJsonPath(arrayJson, '$[0].foo').output, '[\n  1\n]')
  assert.equal(queryJsonPath(arrayJson, '$[0].TEST').output, '[]')
})

test('buildRegexFlags maps DevToys-style options to JavaScript flags', () => {
  assert.equal(buildRegexFlags({ allMatches: true, ignoreCase: true, multiline: true, dotAll: true }), 'gims')
  assert.equal(buildRegexFlags({ allMatches: true, ignoreCase: true, multiline: true, singleline: true }), 'gims')
  assert.equal(buildRegexFlags({ allMatches: false, ignoreCase: false }), '')
})

test('applyIgnorePatternWhitespace drops comments and free spaces', () => {
  assert.equal(applyIgnorePatternWhitespace('a b+  # comment\n[a b]'), 'ab+[a b]')
})

test('runRegex matches, substitutes, and extracts per flavor', () => {
  assert.equal(runRegex({ pattern: 'cat', text: 'cat', flavor: 'javascript', mode: 'substitution', template: '$&s' }).output, 'cats')
  assert.equal(runRegex({ pattern: 'a', text: 'abaca', flavor: 'javascript', mode: 'substitution', template: 'X', allMatches: false }).output, 'Xbaca')
  assert.equal(runRegex({ pattern: '(?P<name>\\w+)', text: 'sam', flavor: 'python', mode: 'extraction', template: '\\g<name>' }).output, 'sam')
  assert.equal(runRegex({ pattern: 'a b', text: 'ab', flavor: 'python', ignoreWhitespace: true }).matches[0].text, 'ab')
  assert.equal(runRegex({ pattern: '\\w+', text: 'é', flavor: 'python' }).matches[0].text, 'é')
  assert.equal(runRegex({ pattern: '\\w+', text: 'é', flavor: 'java' }).matches.length, 0)
  assert.equal(runRegex({ pattern: '\\w+', text: 'é', flavor: 'java', unicode: true }).matches[0].text, 'é')
  assert.equal(runRegex({ pattern: '(\\w+)', text: 'Hi', flavor: 'java', mode: 'substitution', template: '[$1]' }).output, '[Hi]')
  assert.match(runRegex({ pattern: '(?=a)', text: 'a', flavor: 'go' }).error, /does not support lookahead/)
  assert.match(runRegex({ pattern: '(\\w)\\1', text: 'aa', flavor: 'rust' }).error, /backreference/)
  assert.equal(runRegex({ pattern: '(?P<n>ab)', text: 'ab', flavor: 'rust', mode: 'extraction', template: '$1' }).output, 'ab')
  assert.equal(runRegex({ pattern: "(?'n'a)", text: 'a', flavor: 'dotnet', mode: 'substitution', template: '$&' }).output, 'a')
  assert.equal(runRegex({ pattern: 'a\\d', text: 'a1a2', flavor: 'dotnet', allMatches: false, rightToLeft: true }).matches[0].text, 'a2')
  assert.equal(runRegex({ pattern: 'a', text: 'baac', flavor: 'javascript', mode: 'extraction' }).output, 'a\na')
  const unclosed = runRegex({ pattern: '\n(', text: 'a', flavor: 'javascript' })
  assert.match(unclosed.error, /Unclosed \(/)
  assert.match(unclosed.error, /Line 2, character 1:/)
  assert.match(unclosed.error, /\^/)
  assert.match(runRegex({ pattern: '(\\w)', text: 'a', flavor: 'python', mode: 'substitution', template: '\\2' }).error, /no group 2/)
})

test('validateXmlAgainstXsd validates DevToys XML samples', async () => {
  const xsd = readFileSync(`${xmlBase}/ValidXsd.xml`, 'utf8')
  const valid = readFileSync(`${xmlBase}/ValidXml.xml`, 'utf8')
  const invalid = readFileSync(`${xmlBase}/InvalidXml.xml`, 'utf8')
  assert.equal((await validateXmlAgainstXsd(xsd, valid)).severity, 'success')
  assert.equal((await validateXmlAgainstXsd(xsd, invalid)).severity, 'error')
  assert.equal((await validateXmlAgainstXsd('', valid)).severity, 'info')
})
