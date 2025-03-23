/**
 * Encryption utilities for GainzBudget
 * Uses the Web Crypto API for secure encryption/decryption
 */

// Convert a string to an ArrayBuffer
const str2ab = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Convert an ArrayBuffer to a string
const ab2str = (buf: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
};

// Convert a string to a hex string
const str2hex = (str: string): string => {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
};

// Convert a hex string to a string
const hex2str = (hex: string): string => {
  return hex.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
};

// Generate a key from a password
export const generateEncryptionKey = async (password: string): Promise<CryptoKey> => {
  const passwordBuffer = str2ab(password);
  
  // Use a key derivation function to generate a secure key from the password
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Salt should ideally be stored separately and securely
  // For this demo, we're using a fixed salt
  const salt = str2ab('GainzBudgetSalt');
  
  // Derive a key for AES-GCM encryption
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data
export const encryptData = async (data: string, key: CryptoKey): Promise<string> => {
  // Generate a random initialization vector
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const dataBuffer = str2ab(data);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    dataBuffer
  );
  
  // Convert the encrypted data to a string for storage
  // Format: iv:encryptedData
  const ivHex = Array.from(new Uint8Array(iv))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Convert the encrypted buffer to a Base64 string
  const encryptedArray = new Uint8Array(encryptedBuffer);
  let encryptedString = '';
  for (let i = 0; i < encryptedArray.length; i++) {
    encryptedString += String.fromCharCode(encryptedArray[i]);
  }
  const encryptedBase64 = btoa(encryptedString);
  
  return `${ivHex}:${encryptedBase64}`;
};

// Decrypt data
export const decryptData = async (encryptedData: string, key: CryptoKey): Promise<string> => {
  // Parse the IV and encrypted data from the string
  const [ivHex, encryptedBase64] = encryptedData.split(':');
  
  // Convert IV from hex
  const ivArray = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Convert encrypted data from Base64
  const encryptedString = atob(encryptedBase64);
  const encryptedArray = new Uint8Array(encryptedString.length);
  for (let i = 0; i < encryptedString.length; i++) {
    encryptedArray[i] = encryptedString.charCodeAt(i);
  }
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivArray
    },
    key,
    encryptedArray
  );
  
  // Convert the decrypted buffer to a string
  return ab2str(decryptedBuffer);
};

// Simple function to hash a password - in a real app, use a better method
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex string
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Test if encryption is working
export const testEncryption = async (testString: string = 'Test encryption'): Promise<boolean> => {
  try {
    const key = await generateEncryptionKey('test-password');
    const encrypted = await encryptData(testString, key);
    const decrypted = await decryptData(encrypted, key);
    return decrypted === testString;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}; 