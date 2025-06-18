const COIN_SEND_GAS = 21000;
const TOKEN_SEND_GAS = 84000;

function resetTokenList() {
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    removeOptions(ddlCoinTokenToSend);
    var option = document.createElement("option");
    option.text = "Q";
    option.value = "Q";
    ddlCoinTokenToSend.add(option);
    if (offlineSignEnabled === true) {
        var optOther = document.createElement("option");
        optOther.text = "(token)";
        optOther.value = "other";
        ddlCoinTokenToSend.add(optOther);
    }
}

function populateSendScreen() {
    resetTokenList();
    if (offlineSignEnabled === true) {
        return;
    }
    if(currentWalletTokenList == null) {
        return;
    }
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");

    for (var i = 0; i < currentWalletTokenList.length; i++) {
        let token = currentWalletTokenList[i];
        let tokenName = token.name;

        if (tokenName.length > maxTokenNameLength) {
            tokenName = tokenName.substring(0, maxTokenNameLength - 1) + "...";
        }
        tokenName = htmlEncode(tokenName);

        let tokenOption = document.createElement("option");
        tokenOption.text = tokenName;
        tokenOption.value = token.contractAddress;
        ddlCoinTokenToSend.add(tokenOption);
    }
}

async function updateInfoSendScreen() {
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let selectedValue = ddlCoinTokenToSend.value;
    document.getElementById("divCoinTokenToSend").textContent = "";
    document.getElementById("divCoinTokenToSend").style.display = "";
    document.getElementById("divBalanceSendScreen").textContent = "";
    document.getElementById("txtTokenContractAddress").style.display = "none";

    if(offlineSignEnabled == true) {
        document.getElementById("divSendScreenBalanceBox").style.display = "none";
    } else {
        document.getElementById("divSendScreenBalanceBox").style.display = "false";
    }

    if(selectedValue === "Q") {
        document.getElementById("divCoinTokenToSend").textContent = QuantumCoin;
        if(offlineSignEnabled === false) {
            if (currentAccountDetails !== null) {
                let newBalance = await weiToEtherFormatted(currentAccountDetails.balance);
                document.getElementById("divBalanceSendScreen").textContent = newBalance;
            }
        }
    } else {
        if(offlineSignEnabled === true) {
            document.getElementById("txtTokenContractAddress").style.display = "";
            document.getElementById("divCoinTokenToSend").style.display = "none";
        } else {
            for (let i = 0; i < currentWalletTokenList.length; i++) {
                if (currentWalletTokenList[i].contractAddress === selectedValue) {
                    document.getElementById("divBalanceSendScreen").textContent = currentWalletTokenList[i].tokenBalance;
                    document.getElementById("divCoinTokenToSend").textContent = selectedValue;
                    break;
                }
            }
        }
    }

    return false;
}

async function showSendScreen() {
    offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    ddlCoinTokenToSend.disabled = true;
    populateSendScreen();
    await updateInfoSendScreen();
    ddlCoinTokenToSend.disabled = false;

    if (offlineSignEnabled === true) {
        document.getElementById("btnOfflineSign").style.display  = "block";
        document.getElementById("divCurrentNonce").style.display  = "block";
        document.getElementById("btnSendCoins").style.display  = "none";
    } else {
        document.getElementById("btnOfflineSign").style.display  = "none";
        document.getElementById("divCurrentNonce").style.display  = "none";
        document.getElementById("btnSendCoins").style.display  = "block";
    }

    document.getElementById('divNetworkDropdown').style.display = 'none';
    document.getElementById('HomeScreen').style.display = 'none';
    document.getElementById('SendScreen').style.display = 'block';
    document.getElementById('OfflineSignScreen').style.display = 'none';
    document.getElementById('gradient').style.height = '116px';
    document.getElementById("txtSendAddress").value = "";
    document.getElementById("txtSendQuantity").value = "";
    document.getElementById("txtCurrentNonce").value = "";
    document.getElementById("pwdSend").value = "";
    document.getElementById("txtSendAddress").focus();

    return false;
}

async function signOfflineSend() {
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var currentNonce = document.getElementById("txtCurrentNonce").value;
    var sendPassword = document.getElementById("pwdSend").value;
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let selectedValue = ddlCoinTokenToSend.value;
    let CoinTokenToSendName = "";
    if(selectedValue === "Q") {
        CoinTokenToSendName = "coins";
    } else {
        let contractAddress = document.getElementById("txtTokenContractAddress").value;
        if (contractAddress == null || contractAddress.length < ADDRESS_LENGTH_CHECK || IsValidAddress(contractAddress) == false) {
            showWarnAlert(langJson.errors.quantumAddr);
            return false;
        }
        CoinTokenToSendName = "tokens";
    }

    if (sendAddress == null || sendAddress.length < ADDRESS_LENGTH_CHECK || IsValidAddress(sendAddress) == false) {
        showWarnAlert(langJson.errors.quantumAddr);
        return false;
    }

    if (sendQuantity == null || sendQuantity.length < 1) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    let okQuantity = await isValidEther(sendQuantity);
    if (isValidEther(okQuantity) == false) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    if (currentNonce == null || currentNonce.length < 1) {
        showWarnAlert(langJson.errors.enterCurrentNonce);
        return false;
    }

    let tempNonce = parseInt(currentNonce);
    if (Number.isInteger(tempNonce) == false || tempNonce < 0) {
        showWarnAlert(langJson.errors.enterCurrentNonce);
        return false;
    }

    if (sendPassword == null || sendPassword.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }

    let msg = langJson.langValues.signSendConfirm;
    msg = msg.replace("[SEND_QUANTITY]", sendQuantity);
    msg = msg.replace("[TO_ADDRESS]", sendAddress);
    msg = msg.replace("[NONCE]", tempNonce);
    msg = msg.replace("[SEND_COINTOKEN]", CoinTokenToSendName); //already htmlEncoded
    showConfirmAndExecuteOnConfirm(msg, onSignOfflineSendCoinsConfirm);
}

async function onSignOfflineSendCoinsConfirm() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletSignOffline);
}

async function decryptAndUnlockWalletSignOffline() {
    var password = document.getElementById("pwdSend").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        signOfflineTxnSend(quantumWallet);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

async function signOfflineTxnSendToken(quantumWallet) {
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var currentNonce = document.getElementById("txtCurrentNonce").value;
    var coinQuantity = "0";
    var contractAddress = document.getElementById("txtTokenContractAddress").value;

    let gas = TOKEN_SEND_GAS;

    try {
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = parseInt(currentNonce);
        let sendData = getTokenTransferContractData(sendAddress, sendQuantity);

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, contractAddress, coinQuantity, gas, chainId, sendData)
        if (txSigningHash == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            hideWaitingBox();
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, contractAddress, coinQuantity, gas, chainId, sendData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        var txData = transactionGetData(quantumWallet.address, nonce, contractAddress, coinQuantity, gas, chainId, sendData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        hideWaitingBox();
        document.getElementById('txtSignedSendTransaction').value = txData;
        document.getElementById('SendScreen').style.display = "none";
        document.getElementById('OfflineSignScreen').style.display = "block";
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
    }
}

async function signOfflineTxnSend(quantumWallet) {
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let selectedValue = ddlCoinTokenToSend.value;
    if(selectedValue === "Q") {

    } else {
        await signOfflineTxnSendToken(quantumWallet);
        return;
    }
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var currentNonce = document.getElementById("txtCurrentNonce").value;

    try {
        const gas = COIN_SEND_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = parseInt(currentNonce);
        const contractData = null;

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, sendAddress, sendQuantity, gas, chainId, contractData)
        if (txSigningHash == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            hideWaitingBox();
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, sendAddress, sendQuantity, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        let currentDate = new Date();
        var txData = transactionGetData(quantumWallet.address, nonce, sendAddress, sendQuantity, gas, chainId, contractData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        hideWaitingBox();
        document.getElementById('txtSignedSendTransaction').value = txData;
        document.getElementById('SendScreen').style.display = "none";
        document.getElementById('OfflineSignScreen').style.display = "block";
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
    }
}

async function copySignedSendTransaction() {
    await WriteTextToClipboard(document.getElementById('txtSignedSendTransaction').value);
}

async function openOfflineTxnSigningUrl() {
    await OpenUrl("https://QuantumCoin.org/offline-transaction-signing.html");
    return false;
}

async function sendCoins() {
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var sendPassword = document.getElementById("pwdSend").value;
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    var CoinTokenToSendName = ddlCoinTokenToSend.options[ddlCoinTokenToSend.selectedIndex].text;
    var contractAddress = document.getElementById("divCoinTokenToSend").textContent;
    let quantityToSend = "";

    if (sendAddress == null || sendAddress.length < ADDRESS_LENGTH_CHECK || IsValidAddress(sendAddress) == false) {
        showWarnAlert(langJson.errors.quantumAddr);
        return false;
    }

    if (sendQuantity == null || sendQuantity.length < 1) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    let okQuantity = await isValidEther(sendQuantity);
    if (isValidEther(okQuantity) == false) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    if(contractAddress === QuantumCoin) {
        quantityToSend = currentBalance;
        CoinTokenToSendName = langJson.langValues.coins;
    } else {
        quantityToSend = getTokenBalance(contractAddress);
        CoinTokenToSendName = langJson.langValues.tokens;
    }

    if (quantityToSend == null || quantityToSend === "") {
        showWarnAlert(langJson.errors.amountLarge);
        return false;
    }

    let compareResult = await compareEther(sendQuantity, quantityToSend);
    if (compareResult == 1) {
        showWarnAlert(langJson.errors.amountLarge);
        return false;
    }

    if (sendPassword == null || sendPassword.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }

    let msg = langJson.langValues.sendConfirm;
    msg = msg.replace("[SEND_QUANTITY]", sendQuantity);
    msg = msg.replace("[TO_ADDRESS]", sendAddress);
    msg = msg.replace("[SEND_COINTOKEN]", CoinTokenToSendName); //already htmlEncoded
    showConfirmAndExecuteOnConfirm(msg, onSendCoinsConfirm);
}

async function onSendCoinsConfirm() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletSend);
}

async function decryptAndUnlockWalletSend() {
    var password = document.getElementById("pwdSend").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        sendCoinsSubmit(quantumWallet);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

async function sendCoinsSubmit(quantumWallet) {
    let coinTokenToSend = document.getElementById("divCoinTokenToSend").textContent;
    if(coinTokenToSend !== QuantumCoin) {
        await sendTokensSubmit(quantumWallet);
        return;
    }

    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;

    try {
        //get account balance
        currentAccountDetails = null;
        let accountDetails = await getAccountDetails(currentBlockchainNetwork.scanApiDomain, currentWalletAddress);
        currentAccountDetails = accountDetails;

        const gas = COIN_SEND_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = accountDetails.nonce;
        const contractData = null;

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, sendAddress, sendQuantity, gas, chainId, contractData)
        if (txSigningHash == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, sendAddress, sendQuantity, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        let currentDate = new Date();
        var txData = transactionGetData(quantumWallet.address, nonce, sendAddress, sendQuantity, gas, chainId, contractData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        let result = await postTransaction(currentBlockchainNetwork.txnApiDomain, txData);
        if (result == true) {
            let pendingTxn = new TransactionDetails(txHashHex, currentDate, quantumWallet.address, sendAddress, sendQuantity, true);
            pendingTransactionsMap.set(quantumWallet.address.toLowerCase() + currentBlockchainNetwork.index.toString(), pendingTxn);

            setTimeout(() => {
                hideWaitingBox();
                showAlertAndExecuteOnClose(langJson.langValues.sendRequest.replace(TRANSACTION_HASH_TEMPLATE, txHashHex), showWalletScreen);
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
            showWarnAlert(langJson.errors.invalidApiResponse + ' ' + error);
        }
    }
}

async function sendTokensSubmit(quantumWallet) {
    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);

    try {
        //get account balance
        currentAccountDetails = null;
        let accountDetails = await getAccountDetails(currentBlockchainNetwork.scanApiDomain, currentWalletAddress);
        currentAccountDetails = accountDetails;

        var sendAddress = document.getElementById("txtSendAddress").value;
        var sendQuantity = document.getElementById("txtSendQuantity").value;
        var coinQuantity = "0";
        var contractAddress = document.getElementById("divCoinTokenToSend").textContent;

        let gas = TOKEN_SEND_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = accountDetails.nonce;
        let sendData = getTokenTransferContractData(sendAddress, sendQuantity);

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, contractAddress, coinQuantity, gas, chainId, sendData)
        if (txSigningHash == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, contractAddress, coinQuantity, gas, chainId, sendData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        let currentDate = new Date();
        var txData = transactionGetData(quantumWallet.address, nonce, contractAddress, coinQuantity, gas, chainId, sendData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        let result = await postTransaction(currentBlockchainNetwork.txnApiDomain, txData);
        if (result == true) {
            let pendingTxn = new TransactionDetails(txHashHex, currentDate, quantumWallet.address, contractAddress, coinQuantity, true);
            pendingTransactionsMap.set(quantumWallet.address.toLowerCase() + currentBlockchainNetwork.index.toString(), pendingTxn);

            setTimeout(() => {
                hideWaitingBox();
                showAlertAndExecuteOnClose(langJson.langValues.sendRequest.replace(TRANSACTION_HASH_TEMPLATE, txHashHex), showWalletScreen);
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
            showWarnAlert(langJson.errors.invalidApiResponse + ' ' + error);
        }
    }
}