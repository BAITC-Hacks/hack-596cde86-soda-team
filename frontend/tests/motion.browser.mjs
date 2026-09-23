import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
let browser

before(async () => {
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || undefined, headless: true })
})

after(async () => { await browser?.close() })

async function openApp(options = {}) {
  const page = await browser.newPage(options)
  await page.goto(url)
  await page.locator('.catalog-grid').waitFor()
  return page
}

test('measure tooltip fades out instead of disappearing immediately', async () => {
  const page = await openApp()
  try {
    const info = page.getByRole('button', { name: 'Подробнее: M1', exact: true })
    const tooltip = page.locator('#pop-M1')
    await info.hover()
    assert.ok(Number.parseFloat(await tooltip.evaluate((element) => getComputedStyle(element).transitionDuration)) > 0)
    await page.waitForTimeout(240)
    await page.mouse.move(0, 0)
    assert.notEqual(await tooltip.evaluate((element) => getComputedStyle(element).display), 'none')
    assert.equal(await info.locator('..').evaluate((element) => getComputedStyle(element).zIndex), '40')
    await page.waitForTimeout(240)
    assert.equal(await tooltip.evaluate((element) => getComputedStyle(element).visibility), 'hidden')
  } finally { await page.close() }
})

test('district dropdown stays mounted for its closing transition', async () => {
  const page = await openApp()
  try {
    await page.getByText('Загрузить пример').click()
    const trigger = page.locator('.district-select-trigger').first()
    await trigger.click()
    const menu = page.locator('.district-menu').first()
    assert.ok(Number.parseFloat(await menu.evaluate((element) => getComputedStyle(element).transitionDuration)) > 0)
    await trigger.click()
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(await menu.count(), 1)
    assert.equal(await trigger.locator('xpath=ancestor::li').evaluate((element) => getComputedStyle(element).zIndex), '20')
    await page.waitForTimeout(260)
    assert.equal(await menu.evaluate((element) => getComputedStyle(element).visibility), 'hidden')
  } finally { await page.close() }
})

test('district choice dialog animates before it closes', async () => {
  const page = await openApp()
  try {
    await page.locator('.mcard').filter({ hasText: 'Парк / сквер' }).click()
    const dialog = page.locator('.district-dialog')
    assert.ok(Number.parseFloat(await dialog.evaluate((element) => getComputedStyle(element).transitionDuration)) > 0)
    await page.locator('.district-dialog .district-option').first().click()
    assert.equal(await dialog.count(), 1)
    await page.waitForTimeout(260)
    assert.equal(await dialog.count(), 0)
  } finally { await page.close() }
})

test('reference sections have an animated disclosure', async () => {
  const page = await openApp()
  try {
    const details = page.locator('#districts')
    const duration = await details.evaluate((element) => getComputedStyle(element, '::details-content').transitionDuration)
    assert.ok(Number.parseFloat(duration) > 0)
    await details.locator('summary').click()
    assert.equal(await details.getAttribute('open'), '')
  } finally { await page.close() }
})

test('reduced motion removes spatial movement without blocking interaction', async () => {
  const page = await openApp({ reducedMotion: 'reduce' })
  try {
    await page.getByText('Загрузить пример').click()
    const trigger = page.locator('.district-select-trigger').first()
    const menu = page.locator('.district-menu').first()
    assert.equal(await menu.evaluate((element) => getComputedStyle(element).transform), 'none')
    await trigger.click()
    assert.equal(await menu.evaluate((element) => getComputedStyle(element).transform), 'none')
    await page.getByRole('option', { name: 'Алматы' }).click()
    assert.match(await trigger.innerText(), /Алматы/)
  } finally { await page.close() }
})
