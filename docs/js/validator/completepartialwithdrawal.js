const COMPLETE_PARTIAL_WITHDRAWAL_GAS = 100000;

async function completePartialWithdrawal() {
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

    var password = document.getElementById("pwdValidator").value;

    if (password == null || password.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }

    let msg = langJson.langValues.validatorCompletePartialWithdrawalConfirm;
    showConfirmAndExecuteOnConfirm(msg, onCompletePartialWithdrawal);
}

async function onCompletePartialWithdrawal() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletCompletePartialWithdrawal);
}

async function decryptAndUnlockWalletCompletePartialWithdrawal() {
    var password = document.getElementById("pwdValidator").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        completePartialWithdrawalSubmit(quantumWallet);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

async function completePartialWithdrawalSubmit(quantumWallet) {
    offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
    if (offlineSignEnabled === true) {
        await completePartialWithdrawalOfflineSign(quantumWallet);
        return;
    }

    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);

    try {
        //get account balance
        currentAccountDetails = null;
        let accountDetails = await getAccountDetails(currentBlockchainNetwork.scanApiDomain, currentWalletAddress);
        currentAccountDetails = accountDetails;

        const gas = COMPLETE_PARTIAL_WITHDRAWAL_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = accountDetails.nonce;
        const contractData = getCompletePartialWithdrawalContractData();
        const value = "0.0";

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, value, gas, chainId, contractData)
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

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, value, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        let currentDate = new Date();
        var txData = transactionGetData(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, value, gas, chainId, contractData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txData == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        let result = await postTransaction(currentBlockchainNetwork.txnApiDomain, txData);
        if (result == true) {
            let pendingTxn = new TransactionDetails(txHashHex, currentDate, quantumWallet.address, STAKING_CONTRACT_ADDRESS, value, true);
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

async function completePartialWithdrawalOfflineSign(quantumWallet) {
    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);
    let currentNonce = document.getElementById("txtCurrentNonceValidator").value;

    try {
        const gas = COMPLETE_PARTIAL_WITHDRAWAL_GAS;
        const chainId = currentBlockchainNetwork.networkId;
        const nonce = parseInt(currentNonce);
        const contractData = getCompletePartialWithdrawalContractData();
        const value = "0.0";

        var txSigningHash = transactionGetSigningHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, value, gas, chainId, contractData)
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

        var txHashHex = transactionGetTransactionHash(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, value, gas, chainId, contractData,
            base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
        if (txHashHex == null) {
            hideWaitingBox();
            showWarnAlert(langJson.errors.unexpectedError);
            return;
        }

        //account txn data
        let currentDate = new Date();
        var txData = transactionGetData(quantumWallet.address, nonce, STAKING_CONTRACT_ADDRESS, value, gas, chainId, contractData, base64ToBytes(quantumWallet.getPublicKey()), quantumSig);
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

        if (isNetworkError(error)) {
            showWarnAlert(langJson.errors.internetDisconnected);
        } else {
            showWarnAlert(langJson.errors.invalidApiResponse + ' ' + error);
        }
    }
}