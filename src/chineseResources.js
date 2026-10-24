import { createChineseConverter } from './chineseOps.js'
import s2t from '../third-party/simplified-traditional-chinese/s2t.json'
import t2s from '../third-party/simplified-traditional-chinese/t2s.json'
import compatibility from '../third-party/simplified-traditional-chinese/CJK_Compatibility_Ideographs.txt?raw'
import simplifiedPhrases from '../third-party/simplified-traditional-chinese/STPhrases.txt?raw'
import regionalPhrases from '../third-party/simplified-traditional-chinese/STPhrases_GeneratedFromRegionalPhrases.txt?raw'
import simplifiedCharacters from '../third-party/simplified-traditional-chinese/STCharacters.txt?raw'
import traditionalPhrases from '../third-party/simplified-traditional-chinese/TSPhrases.txt?raw'
import traditionalCharactersExt from '../third-party/simplified-traditional-chinese/TSCharactersExt.txt?raw'
import traditionalCharacters from '../third-party/simplified-traditional-chinese/TSCharacters.txt?raw'

const resources = {
  'CJK_Compatibility_Ideographs.txt': compatibility,
  'STPhrases.txt': simplifiedPhrases,
  'STPhrases_GeneratedFromRegionalPhrases.txt': regionalPhrases,
  'STCharacters.txt': simplifiedCharacters,
  'TSPhrases.txt': traditionalPhrases,
  'TSCharactersExt.txt': traditionalCharactersExt,
  'TSCharacters.txt': traditionalCharacters,
}
const converters = new Map()

export function convertChinese(text, direction) {
  const config = { s2t, t2s }[direction]
  if (!config) throw new Error('Unsupported Chinese conversion direction')
  if (!converters.has(direction)) converters.set(direction, createChineseConverter(config, resources))
  return converters.get(direction)(text)
}
