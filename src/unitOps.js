// Factors use international feet/inches and avoirdupois pounds/ounces.
// Taiwan units: 1 台尺 = 10/33 m, 1 台斤 = 600 g = 16 台兩, 1 台兩 = 10 錢, 1 坪 = 400/121 m², 1 甲 = 2934 坪.
// symbol replaces id in labels and results where the id is not the unit's written form.
export const unitGroups = {
  length: [
    { id: 'mm', name: 'Millimetres', factor: 0.001 },
    { id: 'cm', name: 'Centimetres', factor: 0.01 },
    { id: 'm', name: 'Metres', factor: 1 },
    { id: 'km', name: 'Kilometres', factor: 1000 },
    { id: 'in', name: 'Inches', factor: 0.0254 },
    { id: 'ft', name: 'Feet', factor: 0.3048 },
    { id: 'yd', name: 'Yards', factor: 0.9144 },
    { id: 'mi', name: 'Miles', factor: 1609.344 },
    { id: 'nmi', name: 'Nautical miles', factor: 1852 },
    { id: 'tw-cun', name: 'Taiwan cun', symbol: '台寸', factor: 1 / 33 },
    { id: 'tw-chi', name: 'Taiwan chi', symbol: '台尺', factor: 10 / 33 },
  ],
  weight: [
    { id: 'mg', name: 'Milligrams', factor: 0.000001 },
    { id: 'g', name: 'Grams', factor: 0.001 },
    { id: 'kg', name: 'Kilograms', factor: 1 },
    { id: 't', name: 'Metric tonnes', factor: 1000 },
    { id: 'oz', name: 'Ounces', factor: 0.028349523125 },
    { id: 'lb', name: 'Pounds', factor: 0.45359237 },
    { id: 'st', name: 'Stones', factor: 6.35029318 },
    { id: 'tw-qian', name: 'Taiwan qian', symbol: '錢', factor: 0.00375 },
    { id: 'tw-tael', name: 'Taiwan taels', symbol: '台兩', factor: 0.0375 },
    { id: 'tkg', name: 'Taiwan catties', symbol: '台斤', factor: 0.6 },
  ],
  area: [
    { id: 'm2', name: 'Square metres', symbol: 'm²', factor: 1 },
    { id: 'km2', name: 'Square kilometres', symbol: 'km²', factor: 1e6 },
    { id: 'ha', name: 'Hectares', factor: 10000 },
    { id: 'ft2', name: 'Square feet', symbol: 'ft²', factor: 0.09290304 },
    { id: 'ac', name: 'Acres', factor: 4046.8564224 },
    { id: 'ping', name: 'Ping', symbol: '坪', factor: 400 / 121 },
    { id: 'chia', name: 'Chia', symbol: '甲', factor: 2934 * 400 / 121 },
  ],
}

export function convertUnit(value, kind, from, to) {
  const units = unitGroups[kind]
  const source = units?.find(unit => unit.id === from)
  const target = units?.find(unit => unit.id === to)
  if (!source || !target) throw new Error('Choose valid units.')
  if (!['string', 'number'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
    throw new Error('Enter a finite, non-negative amount.')
  }
  const result = Number(value) * (source.factor / target.factor)
  if (!Number.isFinite(result)) throw new Error('The converted amount is out of range.')
  return result
}
