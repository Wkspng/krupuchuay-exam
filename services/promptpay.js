// PromptPay QR (EMVCo) payload generator — no external dependency.
// Produces the standard Thai PromptPay QR string that banking apps can scan.

function tlv(tag, value) {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

// CRC16-CCITT (poly 0x1021, init 0xFFFF) over the payload including the "6304" tag.
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Format the PromptPay target: mobile (0xxxxxxxxx), national id (13 digits),
// or e-wallet (15 digits) — into the correct sub-tag + value.
function formatTarget(id) {
  const digits = String(id || '').replace(/\D/g, '');
  if (digits.length === 13) return { tag: '02', value: digits };          // national ID
  if (digits.length === 15) return { tag: '03', value: digits };          // e-wallet
  // mobile: strip leading 0, prefix with country code 0066 → 13 digits
  const mobile = '0066' + digits.replace(/^0/, '');
  return { tag: '01', value: mobile };
}

/**
 * Build a PromptPay payload string.
 * @param {string} id  PromptPay id (mobile / national id / e-wallet)
 * @param {number} [amount]  fixed amount in THB (optional)
 */
function promptPayPayload(id, amount) {
  const t = formatTarget(id);
  const merchant = tlv('00', 'A000000677010111') + tlv(t.tag, t.value);
  let payload =
    tlv('00', '01') +          // payload format indicator
    tlv('01', '11') +          // static (reusable) QR
    tlv('29', merchant) +      // merchant account info (PromptPay)
    tlv('53', '764');          // currency THB
  if (amount != null && !Number.isNaN(Number(amount))) {
    payload += tlv('54', Number(amount).toFixed(2)); // transaction amount
  }
  payload += tlv('58', 'TH');  // country
  payload += '6304';           // CRC tag + length
  payload += crc16(payload);
  return payload;
}

module.exports = { promptPayPayload, crc16, formatTarget };
