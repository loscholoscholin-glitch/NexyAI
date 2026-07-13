export const CryptoService = {
  async hashPassword(password: string): Promise<string> {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const toBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `pbkdf2$150000$${toBase64(salt)}${toBase64(derivedBits)}`;
  },

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      const [scheme, iterStr, saltB64, hashB64] = storedHash.split("$");
      if (scheme !== "pbkdf2") return false;
      const iterations = parseInt(iterStr, 10);
      const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        keyMaterial,
        256
      );
      const derivedB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
      return derivedB64 === hashB64;
    } catch {
      return false;
    }
  },
};
