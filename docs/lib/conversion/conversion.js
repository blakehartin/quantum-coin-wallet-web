const ConversionMode = {
    SeedPhrase: 'seed',
    DirectPrivateKey: 'key',
    KeyStoreJson: 'keystore',
    Manual: 'manual'
};

const CONVERSION_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000002000";

var conversionAddressMap = new Map();
var ethAddressListSelectOptionTemplate = "";
var ethSeedWordList = "";
var currentConversionEthAddress = ""; //Ethereum address

var conversionEthKey = "";
var conversionEthKeystore = "";
var conversionWallets = [];
var ethSignature = "";

var conversionMode = "";

var heisenAddressMap = new Map();

var conversionContext = "q";

const CONVERSION_MESSAGE_TEMPLATE = "MY ETH ADDRESS IS [ETH_ADDRESS]. I AGREE THAT MY CORRESPONDING QUANTUM ADDRESS FOR GETTING COINS FOR MY DOGEP TOKENS IS [QUANTUM_ADDRESS].";

const TOKEN_CONVERSION_MESSAGE_TEMPLATE = "MY ETH ADDRESS IS [ETH_ADDRESS]. I AGREE THAT MY CORRESPONDING QUANTUM ADDRESS FOR GETTING TOKENS FOR QUANTUM CONTRACT [QUANTUM_CONTRACT_ADDRESS] FOR MY TOKENS IN ETHEREUM CONTRACT [ETH_CONTRACT_ADDRESS] IS [QUANTUM_ADDRESS].";
var HEISEN_CONTRACT_ADDRESS = "0xe8ea8beb86e714ef2bde0afac17d6e45d1c35e48f312d6dc12c4fdb90d9e8a3d";
var TOKEN_CONVERSION_CONTRACT_ADDRESS = "0x90b6b4e9cF99255a7a527F0e8E5a9a8669Af4a8B56B030353127f809292f0632";

var DOGEP_CONTRACT_ADDRESS = "0xe7eaec9bca79d537539c00c58ae93117fb7280b9";

async function initConversion() {
    const response = await fetch("./lib/conversion/dp.csv");
    if (response.ok != true) {
        showWarnAlert(getGenericError("conversion"));
        return false;
    }
    var filedata = await response.text();

    var lines = filedata.split("\n");
    for (i in lines) {
        var columns = lines[i].split(",");
        let item = {
            address: columns[0],
            tokenCount: columns[2],
            coinCount: columns[3]
        }
        conversionAddressMap.set(columns[0].toLowerCase(), item);
    }

    ethAddressListSelectOptionTemplate = document.getElementById("sltEthAddresses").innerHTML;

    await initHeisenConversion();
}

async function initHeisenConversion() {
    const response = await fetch("./lib/conversion/heisen.csv");
    if (response.ok != true) {
        showWarnAlert(getGenericError("conversion"));
        return false;
    }
    var filedata = await response.text();

    var lines = filedata.split("\n");
    for (i in lines) {
        var columns = lines[i].split(",");
        let item = {
            address: columns[0],
            tokenCount: columns[1],
            coinCount: columns[1]
        }
        heisenAddressMap.set(columns[0].toLowerCase(), item);
    }
}

function openConversionHelpUrl() {
    OpenUrl("https://quantumcoin.org/desktop-wallet.html#getting-coins-for-tokens")
    return false;
}

function getHeisenTokens() {
    conversionContext = "h";
    getCoinsScreen1();
}

function getQuantumCoinsForTokens() {
    conversionContext = "q";
    getCoinsScreen1();
}

function getCoinsScreen1() {
    document.getElementById('settingsScreen').style.display = "none";
    document.getElementById('getCoins1').style.display = "block";
    document.getElementById('getCoins2a').style.display = "none";
    document.getElementById('getCoins2b').style.display = "none";
    document.getElementById('getCoins2c').style.display = "none";
    document.getElementById('getCoins2d').style.display = "none";

    document.getElementById('optSeedPhrase').checked = false;
    document.getElementById('optPrivateKey').checked = false;
    document.getElementById('optKeystore').checked = false;
    document.getElementById('optManually').checked = false;

    document.getElementById('optSeedPhrase').focus();

    return false;
}

function getCoinsScreen1Submit() {
    // Get all radio buttons with the name "gender"
    const radioButtons = document.querySelectorAll('input[name="ethwallettype"]');

    // Initialize a variable to store the selected value
    let selectedValue = "";

    // Loop through the radio buttons to find the selected one
    radioButtons.forEach(function (radioButton) {
        if (radioButton.checked) {
            selectedValue = radioButton.value;
        }
    });

    currentConversionEthAddress = "";
    ethSeedWordList = "";
    conversionEthKey = "";
    conversionEthKeystore = "";
    conversionWallets = [];
    ethSignature = "";
    ethAddressSigning = "";
    conversionMode = "";

    document.getElementById("sltEthAddresses").innerHTML = "";
    for (var i = 1; i <= 12; i++) {
        let txtbox = document.getElementById("txtEthSeed" + i.toString());
        txtbox.value = "";
        txtbox.disabled = false;
    }
    document.getElementById("ethPrivateKey").value = "";
    document.getElementById("ethPrivateKey").diabled = false;
    document.getElementById("pwdEthKeyJson").value = "";
    document.getElementById("divEthWalletFilename").textContent = "";    
    document.getElementById("filEthWallet").value = "";
    document.getElementById("txtSignatureMessage").value = "";
    document.getElementById("txtEthAddressSigning").value = "";
    document.getElementById("txtEthAddressSigning").disabled = false;

    if (selectedValue !== "") {
        currentEthConvertOption = selectedValue;
        if (currentEthConvertOption === "seedphrase") {
            document.getElementById('getCoins1').style.display = "none";
            document.getElementById('getCoins2a').style.display = "block";
            document.getElementById('getCoins2b').style.display = "none";
            document.getElementById('getCoins2c').style.display = "none";
            document.getElementById('getCoins2d').style.display = "none";
            document.getElementById('ethAddressList').style.display = "none";
            document.getElementById("sltEthAddresses").innerHTML = "";
            document.getElementById("txtEthSeed1").focus();
            conversionMode = ConversionMode.SeedPhrase;
        } else if (currentEthConvertOption === "privatekey") {
            document.getElementById('getCoins1').style.display = "none";
            document.getElementById('getCoins2a').style.display = "none";
            document.getElementById('getCoins2b').style.display = "block";
            document.getElementById('getCoins2c').style.display = "none";
            document.getElementById('getCoins2d').style.display = "none";
            document.getElementById('ethPrivateKey').focus();
            conversionMode = ConversionMode.DirectPrivateKey;
        } else if (currentEthConvertOption === "keystorejson") {
            document.getElementById('getCoins1').style.display = "none";
            document.getElementById('getCoins2a').style.display = "none";
            document.getElementById('getCoins2b').style.display = "none";
            document.getElementById('getCoins2c').style.display = "block";
            document.getElementById('getCoins2d').style.display = "none";
            document.getElementById('filEthWallet').focus();
            conversionMode = ConversionMode.KeyStoreJson;
        } else if (currentEthConvertOption === "manually") {
            document.getElementById('getCoins1').style.display = "none";
            document.getElementById('getCoins2a').style.display = "none";
            document.getElementById('getCoins2b').style.display = "none";
            document.getElementById('getCoins2c').style.display = "none";
            document.getElementById('getCoins2d').style.display = "block";
            document.getElementById('divEthSignMessage').style.display = "none";
            document.getElementById('txtEthAddressSigning').focus();
            conversionMode = ConversionMode.Manual;
        } else {
            showWarnAlert("Please select an option.");
        }
    } else {
        showWarnAlert("Please select an option.");
    }

    return false;
}
async function loadEthAddressesFromSeed() {
    let tempAddr = document.getElementById("sltEthAddresses").value;
    if (tempAddr != null && tempAddr.length >= 20) {
        currentConversionEthAddress = tempAddr;
        for (var i = 0; i < conversionWallets.length; i++) {
            if (conversionWallets[i].address.toLowerCase() === currentConversionEthAddress.toLowerCase()) {
                break;
            }
        }
        getCoinsScreen4();
        return;
    }

    ethSeedWordList = "";
    currentConversionEthAddress = "";
    conversionEthKey = "";
    conversionEthKeystore = "";
    conversionWallets = [];
    for (var i = 1; i <= 12; i++) {
        var word = document.getElementById("txtEthSeed" + i.toString()).value;
        if (word == null || word.trim().length < 2) {
            showWarnAlert(langJson.errors.ethSeedEmpty);
            return;
        }
        if (i == 1) {
            ethSeedWordList = word;
        } else {
            ethSeedWordList = ethSeedWordList + " " + word;
        }        
    }
    try {
        let walletList = await phraseToWalletsEth(ethSeedWordList);
        conversionWallets = [];
        var mapToUse = conversionAddressMap;
        if(conversionContext === "h") {
            mapToUse = heisenAddressMap;
        }

        for (let index = 0; index < walletList.length; index++) {
            let addr = walletList[index].address.toLowerCase();
            if (mapToUse.has(addr)) {
                conversionWallets.push(mapToUse.get(addr));
            }
        }
        if (conversionWallets.length == 0) {
            showWarnAlert(langJson.errors.noEthConversionWallets);
            return;
        }
        if (conversionWallets.length == 1) {
            for (var i = 1; i <= 12; i++) {
                document.getElementById("txtEthSeed" + i.toString()).disabled = true;
            }
            currentConversionEthAddress = conversionWallets[0].address;
            getCoinsScreen4();
            return;
        }
        let selectList = "";
        for (var i = 0; i < conversionWallets.length; i++) {
            let row = ethAddressListSelectOptionTemplate;
            row = row.replaceAll("[ETH_ADDRESS_VALUE]", conversionWallets[i].address);
            row = row.replace("[ETH_ADDRESS_COINS]", conversionWallets[i].coinCount);
            selectList = selectList + row;
        }
        document.getElementById('ethAddressList').style.display = "flex";
        document.getElementById("sltEthAddresses").innerHTML = selectList;
        for (var i = 1; i <= 12; i++) {
            document.getElementById("txtEthSeed" + i.toString()).disabled = true;
        }
        showWarnAlert(langJson.errors.selectEthAddress);
    }
    catch (error) {
        showWarnAlert(langJson.errors.ethSeedError + " " + error);
    }
}

async function getPrivateKeyFromWalletIndex(index) {
    let keyPairs = await phraseToKeyPairsEth(ethSeedWordList);
    privateKey = keyPairs[index].privateKey;
    return privateKey;
}

function showEthSignMessage() {
    currentConversionEthAddress = document.getElementById('txtEthAddressSigning').value;
    if (currentConversionEthAddress == null || currentConversionEthAddress.length < 2) {
        return;
    }

    var mapToUse = conversionAddressMap;
    if(conversionContext === "h") {
        mapToUse = heisenAddressMap;
    }

    if (mapToUse.has(currentConversionEthAddress.toLowerCase()) == false) {
        return;
    }

    document.getElementById('divEthSignMessage').style.display = "block";
    document.getElementById('txtEthAddressSigning').disabled = true;
    document.getElementById('txtSignatureMessage').value = getConversionMessageSigning(currentConversionEthAddress.toLowerCase(), currentWalletAddress.toLowerCase());
}

function getCoinsScreen2d() {
    document.getElementById('getCoins1').style.display = "none";
    document.getElementById('getCoins2d').style.display = "block";
    document.getElementById('getCoins3d').style.display = "none";
    return false;
}

function getCoinsScreen3d() {
    let ethAddrSigning = document.getElementById("txtEthAddressSigning").value;
    if (ethAddrSigning == null || ethAddrSigning.length < 2) {
        showWarnAlert(langJson.errors.ethAddr);
        return false;
    }

    var mapToUse = conversionAddressMap;
    if(conversionContext === "h") {
        mapToUse = heisenAddressMap;
    }

    if (mapToUse.has(ethAddrSigning.toLowerCase()) == false) {
        showWarnAlert(langJson.errors.noEthConversionWallet);
        return false;
    }

    document.getElementById('getCoins2d').style.display = "none";
    document.getElementById('getCoins3d').style.display = "block";
    document.getElementById('getCoins4').style.display = "none";
    document.getElementById('ethSignature').value = "";
    document.getElementById('ethSignature').focus();

    return false;
}

function backFromGetCoinsScreen4() {
    document.getElementById('getCoins4').style.display = "none";
    if (currentEthConvertOption === "seedphrase") {
        getCoinsScreen1Submit();
    } else if (currentEthConvertOption === "privatekey") {
        getCoinsScreen1Submit();
    } else if (currentEthConvertOption === "keystorejson") {
        getCoinsScreen1Submit();
    } else if (currentEthConvertOption === "manually") {
        getCoinsScreen3d();
    } else {
        showWarnAlert(langJson.errors.selectOption);
    }
}

async function getCoinsScreen4() {
    document.getElementById('getCoins2a').style.display = "none";
    document.getElementById('getCoins2b').style.display = "none";
    document.getElementById('getCoins2c').style.display = "none";
    document.getElementById('getCoins3d').style.display = "none";
    document.getElementById('getCoins4').style.display = "block";

    let offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
    if (offlineSignEnabled == true) {
        document.getElementById('divCurrentNonceConversion').style.display = "block";
    } else {
        document.getElementById('divCurrentNonceConversion').style.display = "none";
    }

    document.getElementById('pwdQuantumPasswordConversion').value = "";
    document.getElementById('txtCurrentNonceConversion').value = "0";
    document.getElementById('divConversionEthAddress').textContent = currentConversionEthAddress;
    document.getElementById('divConversionQuantumAddress').textContent = currentWalletAddress;
    document.getElementById('pwdQuantumPasswordConversion').focus();

    return false;
}

function getConversionMessageSigning(ethAddr, quantumAddr) {
    var msg = CONVERSION_MESSAGE_TEMPLATE;
    if(conversionContext === "h") {
        msg = TOKEN_CONVERSION_MESSAGE_TEMPLATE;
        msg = msg.replace("[QUANTUM_CONTRACT_ADDRESS]", HEISEN_CONTRACT_ADDRESS.toLowerCase())
        msg = msg.replace("[ETH_CONTRACT_ADDRESS]", DOGEP_CONTRACT_ADDRESS.toLowerCase())
    }
    msg = msg.replace("[ETH_ADDRESS]", ethAddr.toLowerCase())
    msg = msg.replace("[QUANTUM_ADDRESS]", quantumAddr.toLowerCase())
    return msg;
}

function getConversionMessageDisplay(ethAddr, quantumAddr) {
    var msg = langJson.langValues.conversionMessage;
    if (conversionContext === "h") {
        msg = langJson.langValues.conversionMessageHeisen;
    }
    msg = msg.replace("[ETH_ADDRESS]", ethAddr.toLowerCase())
    msg = msg.replace("[QUANTUM_ADDRESS]", quantumAddr.toLowerCase())
    return msg;
}

function getCoinsScreen5() {
    let pwdQuantumPasswordConversion = document.getElementById("pwdQuantumPasswordConversion").value;
    if (pwdQuantumPasswordConversion == null || pwdQuantumPasswordConversion.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }
    let msg = getConversionMessageDisplay(currentConversionEthAddress, currentWalletAddress);
    showConfirmAndExecuteOnConfirm(msg, getCoinsOpenQuantumWallet);    
    return false;
}

async function getCoinsOpenQuantumWallet() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletConversion);
}
async function decryptAndUnlockWalletConversion() {
    var password = document.getElementById("pwdQuantumPasswordConversion").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        let offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
        if (offlineSignEnabled == true) {
            signOfflineConversionTransaction(quantumWallet);
        } else {
            postConversionTransaction(quantumWallet);
        }

    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

function cleanupConversion() {
    document.getElementById('getCoins4').style.display = "none";
    document.getElementById('OfflineSignConversionScreen').style.display = "none";
    document.getElementById('txtCurrentNonceConversion').value = "0";
    ethSeedWordList = "";
    currentConversionEthAddress = "";
    conversionEthKey = "";
    conversionEthKeystore = "";
    conversionWallets = [];
    showWalletScreen();
}

async function loadEthAddressFromKey() {
    ethSeedWordList = "";
    currentConversionEthAddress = "";
    conversionEthKey = "";
    conversionEthKeystore = "";
    conversionWallets = [];

    conversionEthKey = document.getElementById("ethPrivateKey").value;
    if (conversionEthKey == null || conversionEthKey.length < 32) {
        showWarnAlert(langJson.errors.invalidEthPrivateKey);
        return;
    }

    try {
        let wallet = await walletEthFromKey(conversionEthKey);
        let addr = wallet.address.toLowerCase();

        var mapToUse = conversionAddressMap;
        if(conversionContext === "h") {
            mapToUse = heisenAddressMap;
        }

        if (mapToUse.has(addr) == false) {
            showWarnAlert(langJson.errors.noEthConversionWallet);
            return;
        }
        currentConversionEthAddress = wallet.address;
        getCoinsScreen4();
        return;
    }
    catch (error) {
        showWarnAlert(langJson.errors.invalidEthPrivateKey);
        return;
    }    
}

async function loadEthAddressFromJson() {
    ethSeedWordList = "";
    currentConversionEthAddress = "";
    conversionEthKey = "";
    conversionEthKeystore = "";
    conversionWallets = [];

    var walletFile = document.getElementById("filEthWallet");
    if (walletFile.files.length == 0) {
        return showWarnAlert(langJson.errors.selectWalletFile);
    }

    var walletPassword = document.getElementById("pwdEthKeyJson").value;
    if (walletPassword == null || walletPassword.length < 1) {
        return showWarnAlert(langJson.errors.enterWalletFilePassword);
    }

    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, loadEthAddressFromJsonFile);
}
async function loadEthAddressFromJsonFile() {   
    try {
        var walletPassword = document.getElementById("pwdEthKeyJson").value;
        var file_to_read = document.getElementById("filEthWallet").files[0];
        var fileread = new FileReader();
        fileread.onload = function (e) {
            var walletJson = e.target.result;

            try {
                let walletDetails = JSON.parse(walletJson);
                if (walletDetails == null) {
                    return showWarnAlert(langJson.errors.walletFileOpenError);
                }

                processEthJsonFile(walletJson, walletPassword);

                return;
            } catch (error) {
                hideWaitingBox();
                return showWarnAlert(langJson.errors.walletFileOpenError);
            }
        };
        fileread.readAsText(file_to_read);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletFileOpenError);
        return;
    }
}

async function processEthJsonFile(walletJson, walletPassword) {
    try {
        let keyStore = await keyStoreAccountEthFromJson(walletJson, walletPassword);
        let addr = keyStore.address.toLowerCase();

        var mapToUse = conversionAddressMap;
        if(conversionContext === "h") {
            mapToUse = heisenAddressMap;
        }

        if (mapToUse.has(addr) == false) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.noEthConversionWallet);
            return;
        }

        currentConversionEthAddress = addr;
        conversionEthKeystore = keyStore;
        hideWaitingBox();
        getCoinsScreen4();

        return;
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletFileOpenError);
        return;
    }
}

const showEthWalletLabel = (event) => {
    const files = event.target.files;
    if (files.length == 0) {
        document.getElementById("divEthWalletFilename").textContent = "";
    } else {
        document.getElementById("divEthWalletFilename").textContent = files[0].name;
    }
    return;
}

async function openSnapshotUrl() {
    await OpenUrl("https://snapshot.dpscan.app");
    return false;
}

async function openSnapshotUrl() {
    await OpenUrl("https://snapshot.dpscan.app");
    return false;
}

function openConversionSigningHelpUrl() {
    OpenUrl("https://quantumcoin.org/desktop-wallet.html#getting-coins-for-tokens-manually")
    return false;
}

async function copyConversionSigningMessage() {
    await WriteTextToClipboard(document.getElementById("txtSignatureMessage").value);
}

async function validateEthSignature() {
    ethSignature = document.getElementById("ethSignature").value;
    if (ethSignature == null || ethSignature.length < 32) {
        showWarnAlert(langJson.errors.enterEthSig);
        return false;
    }

    let msg = getConversionMessageSigning(currentConversionEthAddress.toLowerCase(), currentWalletAddress.toLowerCase());
    let verifyOk = await verifyEthSignature(msg, ethSignature, currentConversionEthAddress);
    if (verifyOk === false) {
        showWarnAlert(langJson.errors.ethSigMatch);
        return false;
    }

    getCoinsScreen4();
}

function bytesToHex(bytArray) {
    return "0x" + bytArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function postConversionTransaction(quantumWallet) {

    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);

    if (conversionMode === ConversionMode.Manual) {

    } else {
        let msg = getConversionMessageSigning(currentConversionEthAddress.toLowerCase(), currentWalletAddress.toLowerCase());
        var privateKey = "";

        if (conversionMode === ConversionMode.SeedPhrase) {
            let walletList = await phraseToWalletsEth(ethSeedWordList);
            for (let index = 0; index < walletList.length; index++) {
                let addr = walletList[index].address.toLowerCase();
                if (addr === currentConversionEthAddress.toLowerCase()) {
                    privateKey = await getPrivateKeyFromWalletIndex(index);
                    break;
                }
            }
            if (privateKey == null || privateKey.length == 0) {
                hideWaitingBox();
                throw new Error("unexpected key size");
            }
        } else if (conversionMode === ConversionMode.DirectPrivateKey) {
            privateKey = conversionEthKey;
        } else if (conversionMode === ConversionMode.KeyStoreJson) {
            privateKey = keyStore.privateKey;
        } else {
            hideWaitingBox();
            throw new Error("unexpected conversionMode");
        }

        ethSignature = await signEthMessageWithKey(privateKey, msg);

        let verifyOk = await verifyEthSignature(msg, ethSignature, currentConversionEthAddress);
        if (verifyOk == false) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.ethSigMatch);
            return false;
        }
    }

    try {
        //get account balance
        let accountDetails = await getAccountDetails(currentBlockchainNetwork.scanApiDomain, currentWalletAddress);        

        var abi = "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"quantumAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"OnConversion\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"quantumAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"ethAddress\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"ethereumSignature\",\"type\":\"string\"}],\"name\":\"OnRequestConversion\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"}],\"name\":\"getAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"}],\"name\":\"getConversionStatus\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"}],\"name\":\"getQuantumAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"ethAddress\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"ethSignature\",\"type\":\"string\"}],\"name\":\"requestConversion\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"quantumAddress\",\"type\":\"address\"}],\"name\":\"setConverted\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]";
        var contractAddress = CONVERSION_CONTRACT_ADDRESS;
        var gas = 300000;

        if(conversionContext === "h") {
            contractAddress = TOKEN_CONVERSION_CONTRACT_ADDRESS;
        }

        const chainId = currentBlockchainNetwork.networkId;
        const nonce = accountDetails.nonce;
        const value = "0.0";
        const currentDate = new Date();

        //contract data
        var contractData = transactionGetContractData("requestConversion", abi, currentConversionEthAddress, ethSignature);

        //account txn message
        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, contractAddress, value, gas, chainId, contractData);

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            hideWaitingBox();
            alert("unexpected cryptoVerify failed");
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, contractAddress, value, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);

        //account txn data
        var txData = transactionGetData(quantumWallet.address, nonce, contractAddress, value, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);

        let result = await postTransaction(currentBlockchainNetwork.txnApiDomain, txData);
        if (result == true) {
            let pendingTxn = new TransactionDetails(txHashHex, currentDate, quantumWallet.address, contractAddress, value, true);
            pendingTransactionsMap.set(quantumWallet.address.toLowerCase() + currentBlockchainNetwork.index.toString(), pendingTxn);

            setTimeout(() => {
                hideWaitingBox();
                showAlertAndExecuteOnClose(langJson.langValues.conversionRequest.replace(TRANSACTION_HASH_TEMPLATE, txHashHex), cleanupConversion);
            }, 1000);
        } else {
            hideWaitingBox();
            showWarnAlert(langJson.errors.invalidApiResponse);
        }
    }
    catch (error) {
        hideWaitingBox();
        if (isNetworkError(error)) {
            showWarnAlert(langJson.errors.internetDisconnected);
        } else {
            showWarnAlert(langJson.errors.invalidApiResponse);
        }
    }
}

async function signOfflineConversionTransaction(quantumWallet) {
    if (conversionMode === ConversionMode.Manual) {

    } else {
        let msg = getConversionMessageSigning(currentConversionEthAddress.toLowerCase(), currentWalletAddress.toLowerCase());
        var privateKey = "";

        if (conversionMode === ConversionMode.SeedPhrase) {
            let walletList = await phraseToWalletsEth(ethSeedWordList);
            for (let index = 0; index < walletList.length; index++) {
                let addr = walletList[index].address.toLowerCase();
                if (addr === currentConversionEthAddress.toLowerCase()) {
                    privateKey = await getPrivateKeyFromWalletIndex(index);
                    break;
                }
            }
            if (privateKey == null || privateKey.length == 0) {
                hideWaitingBox();
                throw new Error("unexpected key size");
            }
        } else if (conversionMode === ConversionMode.DirectPrivateKey) {
            privateKey = conversionEthKey;
        } else if (conversionMode === ConversionMode.KeyStoreJson) {
            privateKey = keyStore.privateKey;
        } else {
            hideWaitingBox();
            throw new Error("unexpected conversionMode");
        }

        ethSignature = await signEthMessageWithKey(privateKey, msg);

        let verifyOk = await verifyEthSignature(msg, ethSignature, currentConversionEthAddress);
        if (verifyOk == false) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.ethSigMatch);
            return false;
        }
    }

    var currentNonce = document.getElementById("txtCurrentNonceConversion").value;
    let tempNonce = parseInt(currentNonce);
    if (Number.isInteger(tempNonce) == false || tempNonce < 0) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.enterCurrentNonce);
        return false;
    }

    try {
        var abi = "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"quantumAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"OnConversion\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"quantumAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"ethAddress\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"ethereumSignature\",\"type\":\"string\"}],\"name\":\"OnRequestConversion\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"}],\"name\":\"getAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"}],\"name\":\"getConversionStatus\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"}],\"name\":\"getQuantumAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"ethAddress\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"ethSignature\",\"type\":\"string\"}],\"name\":\"requestConversion\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"ethAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"quantumAddress\",\"type\":\"address\"}],\"name\":\"setConverted\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]";
        var contractAddress = CONVERSION_CONTRACT_ADDRESS;
        var gas = 300000;

        if(conversionContext === "h") {
            contractAddress = TOKEN_CONVERSION_CONTRACT_ADDRESS;
            gas = 65000;
        }

        const chainId = currentBlockchainNetwork.networkId;
        const nonce = tempNonce;
        const value = "0.0";
        const currentDate = new Date();

        //contract data
        var contractData = transactionGetContractData("requestConversion", abi, currentConversionEthAddress, ethSignature);

        //account txn message
        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, contractAddress, value, gas, chainId, contractData);

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            hideWaitingBox();
            alert("unexpected cryptoVerify failed");
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, contractAddress, value, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);

        //account txn data
        var txData = transactionGetData(quantumWallet.address, nonce, contractAddress, value, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);

        hideWaitingBox();
        document.getElementById('txtSignedConversionTransaction').value = txData;
        document.getElementById('OfflineSignConversionScreen').style.display = "block";
        document.getElementById('getCoins4').style.display = "none";
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
    }
}

async function copySignedConversionTransaction() {
    await WriteTextToClipboard(document.getElementById('txtSignedConversionTransaction').value);
}