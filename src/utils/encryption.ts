export interface EncryptedData {
  cipherText: string;
  iv: string;
  salt: string;
}

const ITERATIONS = 100000;
const HASH_ALGO = "SHA-256";
const ENCRYPT_ALGO = "AES-GCM";
const SALT_LEN = 16;
const IV_LEN = 12;

const ab2str = (buf: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
};

const str2ab = (str: string): ArrayBuffer => {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

const deriveKey = async (
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    { name: ENCRYPT_ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encrypt = async (
  data: string,
  password: string
): Promise<EncryptedData> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();

  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: ENCRYPT_ALGO,
      iv: iv,
    },
    key,
    enc.encode(data)
  );

  return {
    cipherText: ab2str(encryptedContent),
    iv: ab2str(iv),
    salt: ab2str(salt),
  };
};

export const decrypt = async (
  encryptedData: EncryptedData,
  password: string
): Promise<string> => {
  const salt = new Uint8Array(str2ab(encryptedData.salt));
  const iv = new Uint8Array(str2ab(encryptedData.iv));
  const cipherText = str2ab(encryptedData.cipherText);

  const key = await deriveKey(password, salt);

  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: ENCRYPT_ALGO,
        iv: iv,
      },
      key,
      cipherText
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (_e) {
    throw new Error("Decryption failed. Incorrect password.");
  }
};
