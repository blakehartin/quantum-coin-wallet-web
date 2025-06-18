const NEW_DEPOSIT_GAS = 250000;

async function newDeposit() {
    let validatorAddress = document.getElementById("txtValidatorAddress").value;
    let validatorDepositCoins = document.getElementById("txtValidatorDepositCoins").value;
    var password = document.getElementById("pwdValidator").value;

    if (validatorAddress == null || validatorAddress.length < ADDRESS_LENGTH_CHECK || IsValidAddress(validatorAddress) == false) {
        showWarnAlert(langJson.errors.quantumAddr);
        return false;
    }

    if (currentWalletAddress.toLowerCase().trim() === validatorAddress.toLowerCase().trim()) {
        showWarnAlert(langJson.errors.validatorDepositorAddress);
        return false;
    }

    if (validatorDepositCoins == null || validatorDepositCoins.length < 1) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    let okQuantity = await isValidEther(validatorDepositCoins);
    if (isValidEther(okQuantity) == false) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
    if (offlineSignEnabled === true) {
        let currentNonce = document.getElementById("txtCurrentNonceValidator").value;
        if (currentNonce == null || currentNonce.length < 1) {
            showWarnAlert(langJson.errors.enterCurrentNonce);
            return false;
        }

        let tempNonce = parseInt(currentNonce);
        if (Number.isInteger(tempNonce) == false || tempNonce < 0) {
            showWarnAlert(langJson.errors.enterCurrentNonce);
            return false;
        }
    }

    if (password == null || password.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }

    let msg = langJson.langValues.validatorNewDepositConfirm;
    msg = msg.replace("[QUANTITY]", validatorDepositCoins);
    showConfirmAndExecuteOnConfirm(msg, onNewDepositConfirm);
}

async function onNewDepositConfirm() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletNewDeposit);
}

async function decryptAndUnlockWalletNewDeposit() {
    var password = document.getElementById("pwdValidator").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        newDepositSubmit(quantumWallet);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

async function newDepositSubmit(quantumWallet) {
    offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
    if (offlineSignEnabled === true) {
        await newDepositOfflineSign(quantumWallet);
        return;
    }

    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);
    let validatorAddress = document.getElementById("txtValidatorAddress").value;
    let validatorDepositCoins = document.getElementById("txtValidatorDepositCoins").value;

    try {
        //get account balance
        currentAccountDetails = null;
        let accountDetails = await getAccountDetails(currentBlockchainNetwork.scanApiDomain, currentWalletAddress);
        currentAccountDetails = accountDetails;

        const gas = NEW_DEPOSIT_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = accountDetails.nonce;
        const contractData = getNewDepositContractData(validatorAddress);

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, gas, chainId, contractData)
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

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        let currentDate = new Date();
        var txData = transactionGetData(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, gas, chainId, contractData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        let result = await postTransaction(currentBlockchainNetwork.txnApiDomain, txData);
        if (result == true) {
            let pendingTxn = new TransactionDetails(txHashHex, currentDate, quantumWallet.address, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, true);
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

async function newDepositOfflineSign(quantumWallet) {
    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);
    let validatorAddress = document.getElementById("txtValidatorAddress").value;
    let validatorDepositCoins = document.getElementById("txtValidatorDepositCoins").value;
    let currentNonce = document.getElementById("txtCurrentNonceValidator").value;

    try {
        const gas = NEW_DEPOSIT_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const contractData = getNewDepositContractData(validatorAddress);
        const nonce = parseInt(currentNonce);

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, gas, chainId, contractData)
        if (txSigningHash == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        var quantumSig = walletSign(quantumWallet, txSigningHash);

        var verifyResult = cryptoVerify(txSigningHash, quantumSig, base64ToBytes(quantumWallet.getPublicKey()));
        if (verifyResult == false) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        var txData = transactionGetData(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, validatorDepositCoins, gas, chainId, contractData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        hideWaitingBox();
        await showOfflineSignatureDialog(txData);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.genericError + ' ' + error);
    }
}
