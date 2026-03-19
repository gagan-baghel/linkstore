import test from "node:test"
import assert from "node:assert/strict"

import {
  DEFAULT_WHATSAPP_MESSAGE,
  buildWhatsAppUrl,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  resolveWhatsAppMessage,
} from "@/lib/whatsapp"

test("normalizeWhatsAppNumber strips formatting and international prefixes", () => {
  assert.equal(normalizeWhatsAppNumber("+91 98765 43210"), "919876543210")
  assert.equal(normalizeWhatsAppNumber("0044 (20) 1234-5678"), "442012345678")
})

test("isValidWhatsAppNumber accepts international numbers and rejects invalid values", () => {
  assert.equal(isValidWhatsAppNumber("+1 415 555 2671"), true)
  assert.equal(isValidWhatsAppNumber("+81 90 1234 5678"), true)
  assert.equal(isValidWhatsAppNumber("12345"), false)
  assert.equal(isValidWhatsAppNumber("abc"), false)
})

test("resolveWhatsAppMessage falls back to the default copy", () => {
  assert.equal(resolveWhatsAppMessage(""), DEFAULT_WHATSAPP_MESSAGE)
  assert.equal(resolveWhatsAppMessage("Need help choosing a product"), "Need help choosing a product")
})

test("buildWhatsAppUrl builds a wa.me URL with encoded text", () => {
  assert.equal(
    buildWhatsAppUrl("+91 98765 43210", "Need sizing help"),
    "https://wa.me/919876543210?text=Need+sizing+help",
  )
  assert.equal(
    buildWhatsAppUrl("+1 415 555 2671", ""),
    `https://wa.me/14155552671?text=${new URLSearchParams({ text: DEFAULT_WHATSAPP_MESSAGE }).toString().slice(5)}`,
  )
  assert.equal(buildWhatsAppUrl("1234", "Hello"), "")
})
