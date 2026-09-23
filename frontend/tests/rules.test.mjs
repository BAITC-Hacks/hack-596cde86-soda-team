import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { allowedDistricts, availability, directionCounts, selectionCost } from '../src/lib/rules.ts'

const read = (name) => JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'))
const data = { ...read('weights'), ...read('measures'), districts: read('districts') }
const measure = (id) => data.measures.find((item) => item.id === id)
const choice = (id, district = null) => ({ measure_id: id, district })

test('selected cards remain removable when the plan is full', () => {
  assert.equal(availability(measure('M7'), data.example_selection, data).state, 'selected')
  assert.equal(availability(measure('M2'), data.example_selection, data).state, 'blocked')
})

test('global incompatibilities block a measure in every district', () => {
  assert.equal(availability(measure('M3'), [choice('M1', 'esil')], data).state, 'blocked')
  assert.equal(availability(measure('M1'), [choice('M3', 'nura')], data).state, 'blocked')
})

test('same-district conflicts filter IDs without excluding other districts', () => {
  const allowed = allowedDistricts(measure('M7'), [choice('M4', 'nura')], data)
  assert.equal(allowed.includes('nura'), false)
  assert.equal(allowed.includes('esil'), true)
  assert.ok(allowed.every((id) => data.districts.some((district) => district.id === id)))
})

test('budget, selection size, and direction limits follow API rules', () => {
  assert.equal(availability(measure('M2'), [], { ...data, budget: 1 }).state, 'blocked')
  assert.equal(availability(measure('M2'), [choice('M4')], { ...data, rules: { ...data.rules, required_choices: 1 } }).state, 'blocked')
  assert.equal(availability(measure('M8'), [choice('M7', 'nura')], { ...data, rules: { ...data.rules, max_per_direction: 1 } }).state, 'blocked')
  assert.equal(availability(measure('M8'), [choice('M7', 'nura')], data).state, 'available')
})

test('spending and counters reflect the actual catalog', () => {
  const selection = [choice('M7', 'nura'), choice('M8', 'nura'), choice('M12')]
  assert.equal(selectionCost(selection, data), measure('M7').cost + measure('M8').cost + measure('M12').cost)
  assert.deepEqual(directionCounts(selection, data), { T: 0, E: 0, S: 2, B: 0, C: 1 })
})
