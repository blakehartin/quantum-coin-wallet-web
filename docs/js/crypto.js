const CRYPTO_OK = 0
const CRYPTO_SEED_BYTES = 96
const CRYPTO_EXPANDED_SEED_BYTES = 160
const CRYPTO_MESSAGE_LEN = 32
const CRYPTO_SECRETKEY_BYTES = 4064
const CRYPTO_PUBLICKEY_BYTES = 1408
const CRYPTO_COMPACT_SIGNATURE_BYTES = 2558
const CRYPTO_AES_KEY_SIZE = 32;
const CRYPTO_AES_IV_SIZE = 16;
const SCRYPT_SALT_SIZE = 32;
const AES_ALGORITHM = 'AES-CBC';

class EncryptedPayload {

    constructor(cipherText, iv) {
        this.cipherText = cipherText;
        this.iv = iv;
    }

}

class DerivedKey {
    constructor(key, salt) {
        this.key = key;
        this.salt = salt;
    }
}

async function cryptoHash(data) {
    const msgUint8 = new TextEncoder().encode(data); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

function base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes) {
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join("");
    return btoa(binString);
}

function cryptoRandom(size) {
    let randPtr = Module._mem_alloc(size * Uint8Array.BYTES_PER_ELEMENT);
    let ret = Module._dp_randombytes(randPtr, size);
    if (ret != CRYPTO_OK) {
        Module._mem_free(randPtr);
        throw new Error("cryptoRandom failed");
    }
    const randBuf = new Uint8Array(Module.HEAPU8.buffer, randPtr, size);

    const typedRandArray = new Uint8Array(size);

    for (let i = 0; i < randBuf.length; i++) {
        typedRandArray[i] = randBuf[i];
    }

    Module._mem_free(randPtr);
    return typedRandArray;
}

function cryptoNewSeed() {
    return cryptoRandom(CRYPTO_SEED_BYTES);
}

function cryptoExpandSeed(seedArray) {
    if (seedArray == null || seedArray.length != CRYPTO_SEED_BYTES) {
        throw new Error("cryptoExpandSeed basic checks failed");
    }

    //Create seed array input
    const typedSeedArray = new Uint8Array(CRYPTO_SEED_BYTES);
    for (let i = 0; i < CRYPTO_SEED_BYTES; i++) {
        typedSeedArray[i] = seedArray[i];
    }
    const seedPtr = Module._mem_alloc(typedSeedArray.length * typedSeedArray.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(typedSeedArray, seedPtr);

    //Expanded seed buffer
    let expandedSeedPtr = Module._mem_alloc(CRYPTO_EXPANDED_SEED_BYTES * Uint8Array.BYTES_PER_ELEMENT);

    let ret = Module._dp_sign_seedexpander(seedPtr, expandedSeedPtr);
    if (ret != CRYPTO_OK) {
        Module._mem_free(seedPtr);
        Module._mem_free(expandedSeedPtr);
        throw new Error("cryptoExpandSeed failed");
    }

    //Copy back return
    const expandedSeedBuf = new Uint8Array(Module.HEAPU8.buffer, expandedSeedPtr, CRYPTO_EXPANDED_SEED_BYTES);
    const typedExpandedSeedArray = new Uint8Array(CRYPTO_EXPANDED_SEED_BYTES);

    for (let i = 0; i < CRYPTO_EXPANDED_SEED_BYTES; i++) {
        typedExpandedSeedArray[i] = expandedSeedBuf[i];
    }

    Module._mem_free(seedPtr);
    Module._mem_free(expandedSeedPtr);

    return typedExpandedSeedArray;
}

function cryptoNewKeyPairFromSeed(expandedSeedArray) {    
    if (expandedSeedArray.length != CRYPTO_EXPANDED_SEED_BYTES) {
        throw new Error("cryptoNewKeyPairFromSeed basic checks failed");
    }

    let pkPtr = Module._mem_alloc(CRYPTO_PUBLICKEY_BYTES * Uint8Array.BYTES_PER_ELEMENT);
    let skPtr = Module._mem_alloc(CRYPTO_SECRETKEY_BYTES * Uint8Array.BYTES_PER_ELEMENT);

    const typedSeedArray = new Uint8Array(CRYPTO_EXPANDED_SEED_BYTES);
    const seedPtr = Module._mem_alloc(typedSeedArray.length * typedSeedArray.BYTES_PER_ELEMENT);
    
    for (let i = 0; i < expandedSeedArray.length; i++) {
        typedSeedArray[i] = expandedSeedArray[i];
    }
    
    Module.HEAPU8.set(typedSeedArray, seedPtr);

    let ret = Module._dp_sign_keypair_seed(pkPtr, skPtr, seedPtr);

    if (ret != CRYPTO_OK) {
        Module._mem_free(seedPtr);
        Module._mem_free(skPtr);
        Module._mem_free(pkPtr);

        throw new Error("cryptoNewKeyPairFromSeed failed");
    }

    const skBuf = new Uint8Array(Module.HEAPU8.buffer, skPtr, CRYPTO_SECRETKEY_BYTES);
    const pkBuf = new Uint8Array(Module.HEAPU8.buffer, pkPtr, CRYPTO_PUBLICKEY_BYTES);

    const skArray = new Uint8Array(CRYPTO_SECRETKEY_BYTES);
    const pkArray = new Uint8Array(CRYPTO_PUBLICKEY_BYTES);

    for (let i = 0; i < CRYPTO_SECRETKEY_BYTES; i++) {
        skArray[i] = skBuf[i];
    }

    for (let i = 0; i < CRYPTO_PUBLICKEY_BYTES; i++) {
        pkArray[i] = pkBuf[i];
    }

    Module._mem_free(seedPtr);
    Module._mem_free(skPtr);
    Module._mem_free(pkPtr);

    const keyPair = {
        privateKey: bytesToBase64(skArray),
        publicKey: bytesToBase64(pkArray)
    };
    return keyPair;

}

function cryptoSign(messageArray, secretKeyArray) {
    if (messageArray == null || messageArray.length < 1 || messageArray.length > 64 || secretKeyArray.length == null || secretKeyArray.length != CRYPTO_SECRETKEY_BYTES) {
        throw new Error("cryptoSign basic checks failed");
    }

    let smPtr = Module._mem_alloc(CRYPTO_COMPACT_SIGNATURE_BYTES * Uint8Array.BYTES_PER_ELEMENT);
    let smlPtr = Module._mem_alloc_long_long(1 * BigUint64Array.BYTES_PER_ELEMENT);

    const typedMsgArray = new Uint8Array(messageArray.length);
    for (let i = 0; i < messageArray.length; i++) {
        typedMsgArray[i] = messageArray[i];
    }
    const msgPtr = Module._mem_alloc(typedMsgArray.length * typedMsgArray.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(typedMsgArray, msgPtr);

    const typedSkArray = new Uint8Array(secretKeyArray.length);
    for (let i = 0; i < secretKeyArray.length; i++) {
        typedSkArray[i] = secretKeyArray[i];
    }
    const skyPtr = Module._mem_alloc(typedSkArray.length * typedSkArray.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(typedSkArray, skyPtr);

    let ret = Module._dp_sign(smPtr, smlPtr, msgPtr, typedMsgArray.length, skyPtr);
    if (ret != CRYPTO_OK) {
        Module._mem_free(msgPtr);
        Module._mem_free(skyPtr);
        Module._mem_free(smlPtr);
        Module._mem_free(smPtr);

        throw new Error("cryptoSign failed " + ret);
    }

    const sigLenBuf = new BigUint64Array(Module.HEAPU8.buffer, smlPtr, 1);
    if (sigLenBuf != BigInt(CRYPTO_COMPACT_SIGNATURE_BYTES)) {
        throw new Error("cryptoSign failed. signture length " + sigLenBuf);
    }
    const sigBuf = new Uint8Array(Module.HEAPU8.buffer, smPtr, sigLenBuf);
    const sigArray = new Uint8Array(CRYPTO_COMPACT_SIGNATURE_BYTES);
    for (let i = 0; i < CRYPTO_COMPACT_SIGNATURE_BYTES; i++) {
        sigArray[i] = sigBuf[i];
    }

    Module._mem_free(msgPtr);
    Module._mem_free(skyPtr);
    Module._mem_free(smlPtr);
    Module._mem_free(smPtr);

    return sigArray;
}

function cryptoVerify(messageArray, sigArray, publicKeyArray) {
    if (messageArray == null || messageArray.length < 1 || messageArray.length > 64 || sigArray.length == null || sigArray.length < 32 || publicKeyArray == null || publicKeyArray.length != CRYPTO_PUBLICKEY_BYTES) {
        throw new Error("cryptoVerify basic checks failed");
    }

    const typedMsgArray = new Uint8Array(messageArray.length);
    for (let i = 0; i < messageArray.length; i++) {
        typedMsgArray[i] = messageArray[i];
    }
    const msgPtr = Module._mem_alloc(typedMsgArray.length * typedMsgArray.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(typedMsgArray, msgPtr);
    
    const typedSmArray = new Uint8Array(sigArray.length);
    for (let i = 0; i < sigArray.length; i++) {
        typedSmArray[i] = sigArray[i];
    }    
    const smPtr = Module._mem_alloc(typedSmArray.length * typedSmArray.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(typedSmArray, smPtr);
        
    const typedPkArray = new Uint8Array(publicKeyArray.length);
    for (let i = 0; i < publicKeyArray.length; i++) {
        typedPkArray[i] = publicKeyArray[i];
    }
    const pkyPtr = Module._mem_alloc(typedPkArray.length * typedPkArray.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(typedPkArray, pkyPtr);

    let ret = Module._dp_sign_verify(msgPtr, typedMsgArray.length, smPtr, typedSmArray.length, pkyPtr);
    Module._mem_free(msgPtr);
    Module._mem_free(smPtr);
    Module._mem_free(pkyPtr);

    if (ret != CRYPTO_OK) {
        return false;
    }       

    return true;
}

function cryptoNewAesKey() {
    return cryptoRandom(CRYPTO_AES_KEY_SIZE);
}

async function cryptoApiEncrypt(aesKeyArray, plainText) {
    let utf8Encoder = new TextEncoder();
    const plainTextBytesBuffer = utf8Encoder.encode(plainText).buffer;

    const aesKey = await window.crypto.subtle.importKey(
        "raw", //can be "jwk" or "raw"
        aesKeyArray,
        {   //this is the algorithm options
            name:AES_ALGORITHM,
            length: 256
        },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    )

    const iv = cryptoRandom(CRYPTO_AES_IV_SIZE);
    const ivBase64 = bytesToBase64(iv);
    const cipherTextBytesBuffer = await window.crypto.subtle.encrypt({ name: AES_ALGORITHM, iv: iv }, aesKey, plainTextBytesBuffer);
    const cipherTextBytes =  new Uint8Array(cipherTextBytesBuffer);
    const cipherText = bytesToBase64(cipherTextBytes);

    const encryptedPayload = new EncryptedPayload(cipherText, ivBase64);
    return encryptedPayload;
}

async function cryptoApiDecrypt(aesKeyArray, encryptedPayload) {
    const aesKey = await window.crypto.subtle.importKey(
        "raw", //can be "jwk" or "raw"
        aesKeyArray,
        {   //this is the algorithm options
            name:AES_ALGORITHM,
            length: 256
        },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    )
    const iv = base64ToBytes(encryptedPayload.iv).buffer;
    const cipherTextBytes = base64ToBytes(encryptedPayload.cipherText);
    const cipherTextBytesBuffer = cipherTextBytes.buffer;

    let plainTextBytesBuffer = await window.crypto.subtle.decrypt({ name: AES_ALGORITHM, iv: iv }, aesKey, cipherTextBytesBuffer);
    let plainTextBytes =  new Uint8Array(plainTextBytesBuffer);
    let utf8Decoder = new TextDecoder();
    let plainText = utf8Decoder.decode(plainTextBytes);
    return plainText;
}

async function cryptoApiScryptAutoSalt(secretString) {
    const saltBytes = cryptoRandom(SCRYPT_SALT_SIZE);
    return cryptoApiScrypt(secretString, saltBytes);
}

async function cryptoApiScrypt(secretString, saltBytes) {
    //Scrypt from go-dp wasm is used rather than builtin Scrypt of nodejs, since builtin version doesn't support N greater than 16384 and go-dp wallets use 262144 for N
    const derivedKey = Scrypt(secretString, bytesToBase64(saltBytes));

    const scryptDerivedKey = new DerivedKey(derivedKey, bytesToBase64(saltBytes));

    return scryptDerivedKey;
}
