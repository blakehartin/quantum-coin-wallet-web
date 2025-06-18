function transactionGetSigningHash(fromaddress, nonce, toaddress, amount, gas, chainid, data) {
    let messageData = TxnSigningHash(fromaddress, nonce, toaddress, amount, gas, chainid, data);
    var messageBytes = [];
    for (var i = 0; i < messageData.length; ++i) {
        messageBytes.push(messageData.charCodeAt(i));
    }
    return messageBytes;
}

function transactionGetTransactionHash(fromaddress, nonce, toaddress, amount, gas, chainid, data, pkkey, sig) {
    const arrayPkDataToPass = pkkey.toString().split(",");
    const typedPkArray = new Uint8Array(arrayPkDataToPass.length);
    for (let i = 0; i < arrayPkDataToPass.length; i++) {
        typedPkArray[i] = arrayPkDataToPass[i];
    }
    const arraySigDataToPass = sig.toString().split(",");
    const typedSigArray = new Uint8Array(arraySigDataToPass.length);
    for (let i = 0; i < arraySigDataToPass.length; i++) {
        typedSigArray[i] = arraySigDataToPass[i];
    }
    var txnHash = TxnHash(fromaddress, nonce, toaddress, amount, gas, chainid, data, typedPkArray, typedSigArray)
    return txnHash;
}

function transactionGetData(fromaddress, nonce, toaddress, amount, gas, chainid, data, pkkey, sig) {
    const arrayPkDataToPass = pkkey.toString().split(",");
    const typedPkArray = new Uint8Array(arrayPkDataToPass.length);
    for (let i = 0; i < arrayPkDataToPass.length; i++) {
        typedPkArray[i] = arrayPkDataToPass[i];
    }
    const arraySigDataToPass = sig.toString().split(",");
    const typedSigArray = new Uint8Array(arraySigDataToPass.length);
    for (let i = 0; i < arraySigDataToPass.length; i++) {
        typedSigArray[i] = arraySigDataToPass[i];
    }
    var txnData = TxnData(fromaddress, nonce, toaddress, amount, gas, chainid, data, typedPkArray, typedSigArray)
    return txnData;
}

function transactionGetContractData(method, abi, ethAddress, ethSignature) {
    var contractData = ContractData(method, abi, ethAddress, ethSignature)
    var bytes = [];
    for (var i = 0; i < contractData.length; ++i) {
        bytes.push(contractData.charCodeAt(i));
    }
    return bytes;
}

