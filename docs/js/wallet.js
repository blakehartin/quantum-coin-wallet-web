"use strict";

const MAX_WALLETS = 128;
const MAX_WALLET_INDEX_KEY = "MaxWalletIndex";
const WALLET_KEY_PREFIX = "WALLET_";

var WALLET_ADDRESS_TO_INDEX_MAP = new Map(); //key is address, value is index
var WALLET_INDEX_TO_ADDRESS_MAP = new Map(); //key is index, value is address
var WALLET_ADDRESS_TO_INDEX_MAP_LOADED = false;

class Wallet {
    constructor(address, privateKey, publicKey, seed) {
        if (address.startsWith("0x") == false) {
            address = "0x" + address
        }
        this.address = address;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.seed = seed;
    }

    getPrivateKey() {
        if (this.privateKey == null) {
            let seedArray = base64ToBytes(this.seed);
            let keyPair = walletKeyPairFromSeed(seedArray);
            return keyPair.privateKey;
        } else {
            return this.privateKey;
        }
    }

    getPublicKey() {
        if (this.publicKey == null) {
            let seedArray = base64ToBytes(this.seed);
            let keyPair = walletKeyPairFromSeed(seedArray);
            return keyPair.publicKey;
        } else {
            return this.publicKey;
        }
    }

    getSeedArray() {
        if (this.seed == null) {
            return null;
        }
        return base64ToBytes(this.seed);
    }
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

function walletGetAccountAddress(publicKeyArray) {
    const typedPkArray = new Uint8Array(publicKeyArray.length);
    for (let i = 0; i < publicKeyArray.length; i++) {
        typedPkArray[i] = publicKeyArray[i];
    }
    let address = PublicKeyToAddress(typedPkArray);
    return address;
}

async function walletGetMaxIndex() {
    let result = await storageGetItem(MAX_WALLET_INDEX_KEY);
    if (result == null) {
        return -1;
    }

    let maxWalletIndex = parseInt(result);

    if (isNumber(maxWalletIndex) == false) {
        throw new Error('MaxWalletIndex is not a number.');
    }

    if (maxWalletIndex < 0 || maxWalletIndex > MAX_WALLETS) {
        throw new Error('MaxWalletIndex out of range.');
    }

    return maxWalletIndex;
}

function walletKeyPairFromSeed(seedArray) {
    if (seedArray.length != CRYPTO_SEED_BYTES) {
        throw new Error('walletKeyPairFromSeed seed array length is not CRYPTO_SEED_BYTES.');
    }

    let expandedSeedArray = cryptoExpandSeed(seedArray);
    let keyPair = cryptoNewKeyPairFromSeed(expandedSeedArray);
    return keyPair;
}

async function walletCreateNewWalletFromSeed(seedArray) {
    let keyPair = walletKeyPairFromSeed(seedArray);
    let publicKeyArray = base64ToBytes(keyPair.publicKey);
    let address = walletGetAccountAddress(publicKeyArray);
    let seedString = bytesToBase64(seedArray);
    let wallet = new Wallet(address, null, null, seedString); //store only address and seed. keys can be generated dynamically
    return wallet;
}

async function walletCreateNewWallet() {
    let seedArray = cryptoNewSeed();
    let wallet = await walletCreateNewWalletFromSeed(seedArray);
    return wallet;
}

function walletCreateNewWalletFromJson(walletJsonString, passphrase) {
    let keyPairString = JsonToWalletKeyPair(walletJsonString, passphrase);
    if (keyPairString == null) {
        throw new Error('walletCreateNewWalletFromJson JsonToWalletKeyPair failed');
    }
    let keyPairSplit = keyPairString.split(",");
    let privateKeyArray = base64ToBytes(keyPairSplit[0]);
    let publicKeyArray = base64ToBytes(keyPairSplit[1]);
    let walletJsonCheckString = walletGetAccountJson(privateKeyArray, publicKeyArray, passphrase);

    let walletJson1 = JSON.parse(walletJsonString);
    let walletJson2 = JSON.parse(walletJsonCheckString);

    if (walletJson1.address.toLowerCase() != walletJson2.address.toLowerCase()) {
        throw new Error('walletCreateNewWalletFromJson address check failed');
    }

    let wallet = new Wallet(walletJson1.address, keyPairSplit[0], keyPairSplit[1], null);
    return wallet;
}

async function walletSave(wallet, passphrase) {
    if (WALLET_ADDRESS_TO_INDEX_MAP_LOADED == false) {
        await walletLoadAll(passphrase);
    }

    if (WALLET_ADDRESS_TO_INDEX_MAP.has(wallet.address.toString().toLowerCase()) == true) {
        return false;
    }

    let maxWalletIndex = await walletGetMaxIndex();
    maxWalletIndex = maxWalletIndex + 1;

    let key = WALLET_KEY_PREFIX + maxWalletIndex.toString();
    let keyExists = await storageDoesItemExist(key);
    if (keyExists == true) {
        return false;
    }

    let walletJson = JSON.stringify(wallet);
    
    let walletStoreResult = await storageSetSecureItem(passphrase, key, walletJson);
    if (walletStoreResult != true) {
        return false;
    }

    let indexStoreResult = await storageSetItem(MAX_WALLET_INDEX_KEY, maxWalletIndex.toString());
    if (indexStoreResult != true) {
        return false;
    }

    WALLET_ADDRESS_TO_INDEX_MAP.set(wallet.address.toString().toLowerCase(), maxWalletIndex);
    WALLET_INDEX_TO_ADDRESS_MAP.set(maxWalletIndex, wallet.address.toString().toLowerCase());

    return true;
}

async function walletGetByIndex(passphrase, index) {
    let key = WALLET_KEY_PREFIX + index.toString();
    let keyExists = await storageDoesItemExist(key);
    if (keyExists == false) {
        return null;
    }

    let walletJson = await storageGetSecureItem(passphrase, key);
    if (walletJson == null) {
        return null;
    }
    let tempWallet = JSON.parse(walletJson);
    let wallet = new Wallet(tempWallet.address, tempWallet.privateKey, tempWallet.publicKey, tempWallet.seed)
    return wallet;
}

async function walletGetByAddress(passphrase, address) {
    address = address.toString().toLowerCase();
    if (WALLET_ADDRESS_TO_INDEX_MAP_LOADED == false) {
        await walletLoadAll(passphrase);
    }

    if (WALLET_ADDRESS_TO_INDEX_MAP.has(address) == false) {
        return null;
    }

    let wallet = await walletGetByIndex(passphrase, WALLET_ADDRESS_TO_INDEX_MAP.get(address));
    if (wallet == null) {
        return null;
    }

    if (wallet.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error("walletGetByAddress address mismatch");
    }

    return wallet;
}

async function walletLoadAll(passphrase) {
    let maxWalletIndex = await walletGetMaxIndex();
    let walletKeyArray = [];
    for (var i = 0; i <= maxWalletIndex; i++) {
        let key = WALLET_KEY_PREFIX + i.toString();
        walletKeyArray.push(key);
    }

    let walletJsonArray = await storageMultiGetSecureItems(passphrase, walletKeyArray);
    
    if (walletJsonArray.length != maxWalletIndex + 1) {
        throw new Error('walletLoadAll storageMultiGetSecureItems wallet count mismatch.');
    }

    let walletArray = [];
    WALLET_ADDRESS_TO_INDEX_MAP = new Map();
    WALLET_INDEX_TO_ADDRESS_MAP = new Map();
    for (var i = 0; i < walletJsonArray.length; i++) {
        if (walletJsonArray[i] == null) {
            throw new Error('walletLoadAll storageMultiGetSecureItems wallet entry is null.');
        }
        let wallet = JSON.parse(walletJsonArray[i]);
        if (wallet.address == null) {
            throw new Error('walletLoadAll storageMultiGetSecureItems wallet address is null.');
        }
        walletArray.push(wallet);
        WALLET_ADDRESS_TO_INDEX_MAP.set(wallet.address.toLowerCase(), i);
        WALLET_INDEX_TO_ADDRESS_MAP.set(i, wallet.address.toLowerCase());
    }

    WALLET_ADDRESS_TO_INDEX_MAP_LOADED = true;

    return walletArray;
}

function walletGetCachedAddressToIndexMap() {
    return WALLET_ADDRESS_TO_INDEX_MAP;
}

function walletGetCachedIndexToAddressMap() {
    return WALLET_INDEX_TO_ADDRESS_MAP;
}

function walletDoesAddressExistInCache(address) {
    return WALLET_ADDRESS_TO_INDEX_MAP.has(address.toLowerCase());
}

function walletGetAccountJsonFromWallet(wallet, passphrase) {
    let privateKey = wallet.getPrivateKey();
    let publicKey = wallet.getPublicKey();
    let privateKeyArray = base64ToBytes(privateKey);
    let publicKeyArray = base64ToBytes(publicKey);
    return walletGetAccountJson(privateKeyArray, publicKeyArray, passphrase);
}

function walletGetAccountJson(privateKeyArray, publicKeyArray, passphrase) {
    const typedSkArray = new Uint8Array(privateKeyArray.length);
    for (let i = 0; i < privateKeyArray.length; i++) {
        typedSkArray[i] = privateKeyArray[i];
    }
    
    const typedPkArray = new Uint8Array(publicKeyArray.length);
    for (let i = 0; i < publicKeyArray.length; i++) {
        typedPkArray[i] = publicKeyArray[i];
    }

    let walletJsonString = KeyPairToWalletJson(privateKeyArray, publicKeyArray, passphrase);

    let address = walletGetAccountAddress(publicKeyArray);

    let walletJson = JSON.parse(walletJsonString);
    let addressCheck = "0x" + walletJson.address;
    if (addressCheck.toLowerCase() != address.toLowerCase()) {
        return null;
    }

    return walletJsonString;
}

function walletSign(wallet, msgArray) {
    var signature = cryptoSign(msgArray, base64ToBytes(wallet.getPrivateKey()));
    return signature;
}
