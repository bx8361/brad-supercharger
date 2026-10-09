import CryptoJS from 'crypto-js'

/** Compatible with CryptoJS.AES passphrase mode (e.g. 那风工具箱 private-share). */
export function encryptShareText(text, password) {
  if (!String(password ?? '').length) throw new Error('Enter a key.')
  return CryptoJS.AES.encrypt(text ?? '', encodeURIComponent(password)).toString()
}

export function decryptShareText(ciphertext, password) {
  if (!String(password ?? '').length) throw new Error('Enter a key.')
  const out = CryptoJS.AES.decrypt(ciphertext ?? '', encodeURIComponent(password)).toString(CryptoJS.enc.Utf8)
  if (!out) throw new Error('Decryption failed. Check the ciphertext and key.')
  return out
}
