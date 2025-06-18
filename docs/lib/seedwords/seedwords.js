const SEED_LENGTH = 96;

const SEED_MAP = new Map(); //key is word, items are string corresponding to index1 and index2
const SEED_REVERSE_MAP = new Map(); //vice-versa of SEED_MAP
const SEED_HASH = "9289cec415e1d9db8712174987014ebbf3fff570add97793fe400aeb53740757";
const SEED_FRIENDLY_INDEX_ARRAY = ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4', 'c1', 'c2', 'c3', 'c4', 'd1', 'd2', 'd3', 'd4', 'e1', 'e2', 'e3', 'e4', 'f1', 'f2', 'f3', 'f4', 'g1', 'g2', 'g3', 'g4', 'h1', 'h2', 'h3', 'h4', 'i1', 'i2', 'i3', 'i4', 'j1', 'j2', 'j3', 'j4', 'k1', 'k2', 'k3', 'k4', 'l1', 'l2', 'l3', 'l4'];
var SEED_FRIENDLY_INDEX_REVERSE_ARRAY = [];
var SEED_INITIALIZED = false;
const SEED_WORD_LIST = [];
async function sha256digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

function getSeedKey(byte1, byte2) {
    return byte1 + "-" + byte2;
}

function getSeedByteIndicesFromString(indiceKey) {
    var result = indiceKey.split("-");
    if (result.length === 2) {
        return result;
    }
    return null;
}

async function initializeSeedWordsFromUrl(seedWordsUrl) {
    const response = await fetch(seedWordsUrl);
    if (response.ok != true) {
        return false;
    }
    var seedWordsRaw = await response.text();
    var ret = await initializeSeedWordsFromString(seedWordsRaw);
    return ret;
}

async function initializeSeedWordsFromString(seedWordsRaw) {
    
    var filedata = seedWordsRaw;
    var seedMapHashMessage = "";

    var lines = filedata.split("\n");
    for (i in lines) {
        var columns = lines[i].split(",");
        if (columns.length != 3) {
            continue;
        }
        
        var key = columns[0]; //word
        var left = columns[1];
        var right = columns[2];
        if (right.charCodeAt(right.length - 1) === 13) {
            right = columns[2].substring(0, columns[2].length - 1);
        }
        var val = getSeedKey(left, right); //indices
        seedMapHashMessage = seedMapHashMessage + key + "=" + val + ",";
        SEED_MAP.set(key, val);
        SEED_REVERSE_MAP.set(val, key);
        SEED_WORD_LIST.push(key);
    }

    var seedhashstr = await sha256digestMessage(seedMapHashMessage);
    if (seedhashstr === undefined) {
        return false;
    }

    if (seedhashstr === SEED_HASH) {
    } else {
        return false;
    }

    //verify
    for (i = 0; i <= 255; i++) {
        for (j = 0; j <= 255; j++) {
            var testKey = getSeedKey(i, j);
            if (SEED_REVERSE_MAP.has(testKey) === false) {
                return false;
            }
        }
    }

    //Load Friendly Array
    SEED_FRIENDLY_INDEX_REVERSE_ARRAY = new Array(SEED_LENGTH / 2);
    var count = 0;
    for (i = 0; i < SEED_LENGTH / 2; i++) {
        SEED_FRIENDLY_INDEX_REVERSE_ARRAY[i] = [count, count + 1];
        count = count + 2;
    }

    SEED_INITIALIZED = true;
    return true;
}

function getAllSeedWords() {
    return SEED_WORD_LIST;
}
function getSeedWordFromNumberPair(num1, num2) {
    if (num1 < 0 || num1 > 255 || num2 < 0 || num2 > 255) {
        throw new Error("num2 numbers out of range");
    }
    var key = getSeedKey(seedArray[num1], seedArray[num2]);
    return SEED_REVERSE_MAP.get(key);
}

function getWordListFromSeedIndiceString(seedIndiceString) {
    if (SEED_INITIALIZED == false) {
        return null;
    }
    var seedArray = seedIndiceString.split(",");

    return getWordListFromSeedArray(seedArray);
}
function getWordListFromSeedArray(seedArray) {
    if (SEED_INITIALIZED == false) {
        return null;
    }
    
    if (seedArray.length < 2) {
        return null;
    }
    if (seedArray.length % 2 != 0) {
        return null;
    }

    var seedWordArray = new Array(seedArray.length / 2);
    var wordIndex = 0;
    for (i = 0; i < seedArray.length; i = i + 2) {
        var key = getSeedKey(seedArray[i], seedArray[i + 1]);
        if (SEED_REVERSE_MAP.has(key) === false) {
            return null;
        }
        seedWordArray[wordIndex] = SEED_REVERSE_MAP.get(key);
        wordIndex = wordIndex + 1;
    }

    return seedWordArray;
}

function getFriendlySeedIndex(index) {
    if (SEED_INITIALIZED == false) {
        return null;
    }
    if (index < 0 || index > (SEED_LENGTH / 2) - 1) {
        return null;
    }
    return SEED_FRIENDLY_INDEX_ARRAY[index];
}

function getIndicesFromFriendlySeed(word) {
    if (SEED_INITIALIZED == false) {
        return null;
    }
    word = word.toLowerCase();
    if (SEED_MAP.has(word) === false) {
        return null;
    }
    var byteIndicesString = SEED_MAP.get(word);
    var temp = getSeedByteIndicesFromString(byteIndicesString);
    if (temp === null) {
        return null;
    }
    var byteArray = new Array(2);
    byteArray[0] = parseInt(temp[0]);
    byteArray[1] = parseInt(temp[1]);
    return byteArray;
}

function getSeedArrayFromSeedWordList(wordList) {
    if (SEED_INITIALIZED == false) {
        return null;
    }

    var seedIndexArray = new Array(wordList.length * 2);
    var seedIndex = 0;
    for (i = 0; i < wordList.length; i = i + 1) {
        var byteArray = getIndicesFromFriendlySeed(wordList[i]);
        if (byteArray == null) {
            return null;
        }
        seedIndexArray[seedIndex] = byteArray[0];
        seedIndexArray[seedIndex + 1] = byteArray[1];
        seedIndex = seedIndex + 2;
    }

    return seedIndexArray;
}

function getWordFromFriendlySeed(friendlySeedIndex, friendlySeedArray) {   
    if (SEED_INITIALIZED == false) {
        return null;
    }
    if (friendlySeedIndex < 0 || friendlySeedIndex > (SEED_LENGTH / 2) - 1) { //0 to 39 is valid range
        return null;
    }

    var actualSeedValue1 = friendlySeedArray[SEED_FRIENDLY_INDEX_REVERSE_ARRAY[friendlySeedIndex][0]];
    var actualSeedValue2 = friendlySeedArray[SEED_FRIENDLY_INDEX_REVERSE_ARRAY[friendlySeedIndex][1]];
    var seedKey = getSeedKey(actualSeedValue1, actualSeedValue2);
    if (SEED_REVERSE_MAP.has(seedKey) === false) {
        return null;
    }
    return SEED_REVERSE_MAP.get(seedKey);
}

function doesSeedWordExist(word) {
    if (SEED_INITIALIZED == false) {
        return null;
    }
    word = word.toLowerCase();
    if (SEED_MAP.has(word) === false) {
        return false;
    }

    return true;
}

function verifySeedWord(friendlySeedIndex, seedWord, seedArray) {
    if (SEED_INITIALIZED == false) {
        return null;
    }
    seedWord = seedWord.toLowerCase();
    if (SEED_MAP.has(seedWord) === false) {
        return false;
    }

    var actualSeedWord = getWordFromFriendlySeed(friendlySeedIndex, seedArray);
    if (actualSeedWord === null) {
        return false;
    }

    if (seedWord === actualSeedWord) {
        return true;
    }

    return false;
}

