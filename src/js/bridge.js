async function WriteTextToClipboard(text) {
    await navigator.clipboard.writeText(text);
}

async function OpenUrl(url) {
    window.open(url);
}

async function GetAppVersion() {
    let appVersion = "v3.1.10";
    return appVersion;
}

async function ReadFile(url) {
    let response = await (await fetch(url));
    const text = await response.text();
    return text;
}

async function getLocalStoragePath() {
    keyStore = await LocalStorageApi.send('StorageApiGetPath', null);
    return keyStore;
}

async function phraseToWalletsEth(phrase) {
    walletList = await EthersApi.send('EthersApiPhraseToWallets', phrase);
    return walletList;
}

async function phraseToKeyPairsEth(phrase) {
    walletList = await EthersApi.send('EthersApiPhraseToKeyPairs', phrase);
    return walletList;

}

async function signEthMessageWithPhrase(phrase, index, message) {
    const signingRequest = {
        phrase: phrase,
        index: index,
        message: message
    }
    sig = await EthersApi.send('EthersApiSignMessageWithPhrase', signingRequest);
    return sig;
}

async function verifyEthSignature(message, signature, address) {
    const verifyRequest = {
        message: message,
        signature: signature,
        address: address
    }
    let ok = await EthersApi.send('EthersApiVerify', verifyRequest);
    return ok;
}

async function walletEthFromKey(privateKey) {
    wallet = await EthersApi.send('EthersApiWalletFromKey', privateKey);
    return wallet;
}

async function signEthMessageWithKey(key, message) {
    const signingRequest = {
        key: key,
        message: message
    }
    sig = await EthersApi.send('EthersApiSignMessageWithKey', signingRequest);
    return sig;
}

async function keyStoreAccountEthFromJson(json, password) {
    const decryptRequest = {
        json: json,
        password: password
    }
    keyStore = await EthersApi.send('EthersApiKeyStoreAccountFromJson', decryptRequest);
    return keyStore;
}

async function weiToEther(wei) {
    let eth = ethers.formatEther(wei)
    return eth
}

async function etherToWei(eth) {
    let wei = ethers.parseUnits(eth, "ether")
    return wei
}

function commify(value) {
    const match = value.match(/^(-?)([0-9]*)(\.?)([0-9]*)$/);
    if (!match || (!match[2] && !match[4])) {
        throw new Error(`bad formatted number: ${JSON.stringify(value)}`);
    }

    const neg = match[1];
    const whole = BigInt(match[2] || 0).toLocaleString("en-us");
    const frac = match[4] ? match[4].match(/^(.*?)0*$/)[1] : "0";

    return `${neg}${whole}.${frac}`;
}

async function weiToEtherFormatted(wei) {
    let eth = ethers.formatEther(wei)
    eth = commify(eth);

    if (eth.endsWith(".")) {
        eth = eth.substring(0, eth.length - 1);
    }

    return eth
}

async function hexWeiToEthFormatted(hex) {
    let wei = BigInt(hex).toString();
    let eth = await weiToEtherFormatted(wei);
    return eth;
}

async function isValidEther(quantity) {
    try {
        if (quantity.startsWith("0")) {
            return false;
        }
        const number = ethers.FixedNumber.fromString(quantity);
        let isNegative = number.isNegative();
        return !isNegative;
    }
    catch (error) {
        return false;
    }
}

async function compareEther(val1, val2) {
    try {
        const number1 = ethers.FixedNumber.fromString(val1.replaceAll(",",""));
        const number2 = ethers.FixedNumber.fromString(val2.replaceAll(",", ""));
        if (number1.isNegative() || number2.isNegative()) {
            throw new Error("error parsing numbers. negative values.");
        }

        if (number1.eq(number2)) {
            return 0;
        } else if (number1.gt(number2)) {
            return 1;
        } else {
            return -1;
        }
    }
    catch (error) {
        throw new Error("error parsing numbers");
    }
}