var modalOkDialog = document.getElementById("modalOkDialog");
var divSuccess = document.getElementById("divSuccess");
var divWarn = document.getElementById("divWarn");
var pDetails = document.getElementById("pDetails");
var span = document.getElementsByClassName("close")[0];
var onCloseFunc = null;

var modalConfirm = document.getElementById("modalConfirmDialog");
var pDetailsConfirm = document.getElementById("pDetailsConfirm");
var txtConfirm = document.getElementById("txtConfirm");
var spanConfirm = document.getElementsByClassName("proceed")[0];
var spanCancel = document.getElementsByClassName("cancel")[0];

var onConfirmFunc = null;

//Network
var modalNetwork = document.getElementById("modalNetworkDialog");
var spanNetwork = document.getElementsByClassName("oknetwork")[0];
var spanCancelNetwork = document.getElementById("divCancelNetwork");
var onCloseFuncNetwork = null;

//Offline Txn Signing
var modaOfflineTxnSigning = document.getElementById("modalOfflineTxnSigning");
var btnOkOfflineTxnSigning = document.getElementById("btnOkOfflineTxnSigning");
var btnCancelOfflineTxnSigning = document.getElementById("btnCancelOfflineTxnSigning");
var onCloseFuncOfflineTxnSigning = null;

function showAlert(txt) {
    modalOkDialog.style.display = "block";
    modalOkDialog.showModal();
    divSuccess.style.display = "block";
    divWarn.style.display = "none";
    pDetails.innerText = htmlEncode(txt);
}

function showWarnAlert(txt) {
    modalOkDialog.style.display = "block";
    modalOkDialog.showModal();
    divSuccess.style.display = "none";
    divWarn.style.display = "block";
    if (txt == null) {
        pDetails.innerText = "";
    } else {
        pDetails.innerText = htmlEncode(txt.toString());
    }
}

function showAlertAndExecuteOnClose(txt, f) {
    modalOkDialog.style.display = "block";
    modalOkDialog.showModal();
    divSuccess.style.display = "block";
    divWarn.style.display = "none";
    pDetails.innerText = htmlEncode(txt);
    onCloseFunc = f;
}

function showWarnAlertAndExecuteOnClose(txt, f) {
    modalOkDialog.style.display = "block";
    modalOkDialog.showModal();
    divSuccess.style.display = "none";
    divWarn.style.display = "block";
    pDetails.innerText = htmlEncode(txt);
    onCloseFunc = f;
}

async function showNetworkDialog(f) {
    await showBlockchainNetworks();
    modalNetwork.style.display = "block";
    modalNetwork.showModal();
    onCloseFuncNetwork = f;
    return false;
}

span.onclick = function () {
    modalOkDialog.style.display = "none";
    modalOkDialog.close();
    if (onCloseFunc == null) {

    } else {
        onCloseFunc();
        onCloseFunc = null;
    }
}


spanConfirm.onclick = function () {
    if (!txtConfirm.value || txtConfirm.value != "i agree") {
        txtConfirm.value = "";
        return;
    }
    modalConfirm.style.display = "none";
    modalConfirm.close();
    document.getElementById("txtConfirm").value = "";
    if (onConfirmFunc == null) {

    } else {
        onConfirmFunc();
        onConfirmFunc = null;
    }
}

spanCancel.onclick = function () {
    modalConfirm.style.display = "none";
    modalConfirm.close();
    onConfirmFunc = null;
}

function showConfirmAndExecuteOnConfirm(txt, f) {
    document.getElementById("txtConfirm").value = "";
    modalConfirm.style.display = "block";
    modalConfirm.showModal();
    pDetailsConfirm.innerText = txt;
    onConfirmFunc = f;
    document.getElementById("txtConfirm").focus();
}

spanNetwork.onclick = function () {
    modalNetwork.style.display = "none";
    modalNetwork.close();
    var network = document.querySelector('input[name="network_option"]:checked')?.value;
    if (!network || network === "") {

    } else {
        saveSelectedBlockchainNetwork();
    }

    if (onCloseFuncNetwork == null) {

    } else {
        onCloseFuncNetwork();
        onCloseFuncNetwork = null;
    }
}

spanCancelNetwork.onclick = function () {
    modalNetwork.style.display = "none";
    modalNetwork.close();
    onCloseFuncNetwork = null;
}

async function showOfflineTxnSettingDialog(f) {
    var defaultVal = await offlineTxnSigningGetDefaultValue();
    if (defaultVal == false) {
        document.getElementById('optOfflineTxnSigningDisabled').checked = true;
    } else {
        document.getElementById('optOfflineTxnSigningEnabled').checked = true;
    }
    modaOfflineTxnSigning.style.display = "block";
    modaOfflineTxnSigning.showModal();
    onCloseFuncOfflineTxnSigning = f;
    return false;
}

btnOkOfflineTxnSigning.onclick = function () {
    modaOfflineTxnSigning.style.display = "none";
    modaOfflineTxnSigning.close();
    var offlineTxnSigningValue = document.querySelector('input[name="optOfflineTxnSigning"]:checked')?.value;
    if (!offlineTxnSigningValue || offlineTxnSigningValue === "") {

    } else {
        saveSelectedOfflineTxnSigningSetting();
    }

    if (onCloseFuncOfflineTxnSigning == null) {

    } else {
        onCloseFuncOfflineTxnSigning();
        onCloseFuncOfflineTxnSigning = null;
    }
}

btnCancelOfflineTxnSigning.onclick = function () {
    modaOfflineTxnSigning.style.display = "none";
    modaOfflineTxnSigning.close();
    onCloseFuncOfflineTxnSigning = null;
}


window.onclick = function (event) {
    if (event.target == modalOkDialog || event.target == modalConfirm || event.target == modalNetwork || event.target == modaOfflineTxnSigning || event.target == modalOfflineSignature) {
        if (modalOkDialog.style.display !== "none") {
            modalNetwork.style.display = "none";
            modalNetwork.close();
        }

        if (modalConfirm.style.display !== "none") {
            modalConfirm.style.display = "none";
            modalConfirm.close();
        }

        if (modalNetwork.style.display !== "none") {
            modalNetwork.style.display = "none";
            modalNetwork.close();
        }

        if (modaOfflineTxnSigning.style.display !== "none") {
            modaOfflineTxnSigning.style.display = "none";
            modaOfflineTxnSigning.close();
        }
    }
}

function showErrorAndLockup(err) {
    modalOkDialog.style.display = "block";
    divSuccess.style.display = "none";
    divWarn.style.display = "block";
    modalOkDialog.showModal();

    document.getElementById('login-content').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('settings-content').style.display = 'none';
    document.getElementById('wallets-content').style.display = 'none';
    document.getElementById('divNetworkDropdown').style.display = 'none';

    let msg = getGenericError(err);
    pDetails.innerText = htmlEncode(msg);
}

function showLoadingAndExecuteAsync(txt, f) {
    document.getElementById("modalWaitDialog").style.display = "block";
    document.getElementById("modalWaitDialog").showModal();
    pWaitDetails.innerText = txt;
    setTimeout(() => {
        f();
    }, 60);
}

function hideWaitingBox() {
    document.getElementById("modalWaitDialog").style.display = "none";
    document.getElementById("modalWaitDialog").close();
}

function updateWaitingBox(txt) {
    pWaitDetails.innerText = txt;
}

let modalEulaDialog = document.getElementById("modalEulaDialog");
function showEula() {
    modalEulaDialog.style.display = "block";
    modalEulaDialog.showModal();
    document.getElementById("divEula").innerHTML = langJson.langValues.eula;
}

var spanIAgree = document.getElementById("divIAgree");

spanIAgree.onclick = async function () {
    modalEulaDialog.style.display = "none";
    modalEulaDialog.close();
    await storeEulaAccepted();
    await resumePostEula();
}

//Offline Signature
var modalOfflineSignature = document.getElementById("modalOfflineSignature");
var btnOkOfflineSignature = document.getElementById("btnOkOfflineSignature");
var onCloseFuncOfflineSignature = null;

async function showOfflineSignatureDialog(txData, f) {
    document.getElementById('txtOfflineSignature').value = txData;
    modalOfflineSignature.style.display = "block";
    modalOfflineSignature.showModal();
    onCloseFuncOfflineSignature = f;
    return false;
}

btnOkOfflineSignature.onclick = function () {
    modalOfflineSignature.style.display = "none";
    modalOfflineSignature.close();

    if (onCloseFuncOfflineSignature == null) {

    } else {
        onCloseFuncOfflineSignature();
        onCloseFuncOfflineSignature = null;
    }
}