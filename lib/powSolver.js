/**
 * Browser Proof-of-Work (PoW) Solver for Docpine Sandbox Authentication
 *
 * Uses native browser Web Crypto API (crypto.subtle) to solve SHA-256
 * leading zero bits difficulty challenges in ~15–40ms.
 */

/**
 * @typedef {Object} PoWChallenge
 * @property {string} challenge
 * @property {string} salt
 * @property {number} difficulty
 * @property {number} expires_at
 * @property {string} signature
 */

/**
 * @typedef {PoWChallenge & { nonce: string }} PoWSolution
 */

/**
 * Solves a Proof-of-Work challenge by finding a nonce that produces a SHA-256
 * hash with the required number of leading zero bits.
 *
 * @param {PoWChallenge} chal - The PoW challenge received from the backend
 * @returns {Promise<PoWSolution>} The challenge object merged with the solved nonce
 */
export async function solvePoW(chal) {
  if (!chal || typeof chal.difficulty !== "number") {
    throw new Error("Invalid PoW challenge structure");
  }

  const enc = new TextEncoder();
  let nonce = 0;

  const fullBytes = Math.floor(chal.difficulty / 8);
  const remainingBits = chal.difficulty % 8;
  const mask = remainingBits > 0 ? (0xff << (8 - remainingBits)) & 0xff : 0;

  // Use global crypto or fallback
  const cryptoObj = typeof window !== "undefined" && window.crypto
    ? window.crypto
    : globalThis.crypto;

  if (!cryptoObj?.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not supported in this environment");
  }

  while (true) {
    const nonceStr = nonce.toString();
    const data = enc.encode(chal.challenge + chal.salt + nonceStr);
    const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
    const hash = new Uint8Array(hashBuffer);

    let match = true;
    for (let i = 0; i < fullBytes; i++) {
      if (hash[i] !== 0) {
        match = false;
        break;
      }
    }

    if (match && remainingBits > 0) {
      if ((hash[fullBytes] & mask) !== 0) {
        match = false;
      }
    }

    if (match) {
      return {
        ...chal,
        nonce: nonceStr,
      };
    }

    nonce++;
  }
}

/**
 * Pre-fetches an optional Proof-of-Work puzzle from the backend
 *
 * @param {string} apiBaseUrl - Base API URL (e.g. "http://127.0.0.1:8080")
 * @returns {Promise<PoWChallenge>} The fetched challenge object
 */
export async function fetchPoWChallenge(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/challenges/pow`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to pre-fetch PoW challenge: HTTP ${res.status}`);
  }

  return await res.json();
}
