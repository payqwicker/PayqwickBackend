const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
function generateRandomUniqueOTP(length) {
  const charset = '0123456789'; // Define the character set for the OTP (digits 0-9).
  const uniqueDigits = new Set(); // Store unique digits.

  if (length > charset.length) {
    throw new Error('Desired OTP length exceeds the character set size.');
  }

  // Generate unique OTP digits.
  while (uniqueDigits.size < length) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    const randomDigit = charset[randomIndex];
    uniqueDigits.add(randomDigit);
  }

  // Convert the set of unique digits into a string.
  const otp = Array.from(uniqueDigits).join('');

  return otp;
}

// Usage example to generate a 6-digit OTP:

function computeHash(referenceNumber, amount, number, hmacKey) {
  const hashInput = referenceNumber + amount + number + hmacKey;

  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');

  return hash;
}

function computeMerchantHash(
  referenceNumber,
  merchantAccount,
  merchantReferenceNumber,
  merchantServiceProductCode,
  hmacKey
) {
  const hashInput =
    referenceNumber +
    merchantAccount +
    merchantReferenceNumber +
    merchantServiceProductCode +
    hmacKey;

  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');

  return hash;
}
function computeMerchantPaymentHash(
  referenceNumber,
  amount,
  merchantAccount,
  merchantReferenceNumber,
  hmacKey
) {
  const hashInput =
    referenceNumber +
    amount +
    merchantAccount +
    merchantReferenceNumber +
    hmacKey;

  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');

  return hash;
}

function computeTransactionStatusHash(referenceNumber, hmacKey) {
  const hashInput = referenceNumber + hmacKey;

  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');

  return hash;
}
function computeBankDepositHash(
  referenceNumber,
  amount,
  destinationBankUUID,
  destinationBankAccountNumber,
  hmacKey
) {
  const hashInput =
    referenceNumber +
    amount +
    destinationBankUUID +
    destinationBankAccountNumber +
    hmacKey;

  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');

  return hash;
}

function computeBankValidateHash(
  referenceNumber,
  amount,
  destinationBankUUID,
  destinationBankAccountNumber,
  hmacKey
) {
  const hashInput =
    referenceNumber +
    amount +
    destinationBankUUID +
    destinationBankAccountNumber +
    hmacKey;

  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');

  return hash;
}



 function computecreateAccountHash(
  referenceNumber ,
  accountReference ,
  hashKey,
  callbackUrl
) {
  
  const hashInput =
    referenceNumber +
    accountReference +
    callbackUrl +
    hashKey
    ;
  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');
  console.log(hash)
  return hash;
}

// statusCode + accountNumber + amount + clearingFeeAmount + transferFeeAmount + hashKey


function computeVerifiedHash(
  statusCode ,
  accountNumber ,
  amount,
  clearingFeeAmount,
  transferFeeAmount,
  hashKey
) {
  // console.log(hashKey)
  const hashInput =
    statusCode +
    accountNumber +
    amount +
    clearingFeeAmount + 
    transferFeeAmount + 
    hashKey
    ;
    // console.log(hashInput)
  const sha512 = crypto.createHash('sha512');
  sha512.update(hashInput, 'utf8');
  const hash = sha512.digest('hex');
  // console.log(hash)
  return hash;
}

function computeVerifiedAirtimeHash(
  referenceNumber,
  amount,
  destinationPhoneNumber,
  hashKey
) {
  // console.log(hashKey)
  const hashInput = amount + referenceNumber+ destinationPhoneNumber +
    hashKey;
  // console.log(hashInput)
  const sha512 = crypto.createHash("sha512");
  sha512.update(hashInput, "utf8");
  const hash = sha512.digest("hex");
  // console.log(hash)
  return hash;
}



// function createHashToCompare(body, hmac) {
//   let hash = "";

//   // Exclude keys: firstName, lastName, accountName, and email
//   const hashParams = { ...body };
//   // console.log(hashParams)
//   delete hashParams.firstName;
//   delete hashParams.lastName;
//   delete hashParams.accountName;
//   delete hashParams.email;

//   // Iterate over the original body and append values for matching keys
//   for (const key in body) {
//     if (hashParams.hasOwnProperty(key)) {
//       hash += body[key];
//     }
//   }

//   // Append the hmac key to the hash string
//   hash += hmac;

//   // Generate and return the SHA-512 hash
//   return crypto.createHash("sha512").update(hash).digest("hex");
// }


// Function to compute hash
function computeToCompareHash(body, preSharedKey) {
  // Concatenate required fields in the exact order
  const dataToHash = `${body.statusCode}${body.accountNumber}${body.amount}${body.clearingFeeAmount}${preSharedKey}`
   
 const sha512 = crypto.createHash("sha512");
 sha512.update(dataToHash, "utf8");
 const hash = sha512.digest("hex");
 return hash
}

 // body.statusCode +
    // body.transactionReference +
    // body.accountNumber +
    // body.amount +
    // body.clearingFeeAmount +
    // preSharedKey; // Append the pre-shared key
// console.log(dataToHash)
  // Generate SHA-512 hash



module.exports = {
  computeHash,
  generateRandomUniqueOTP,
  computeMerchantHash,
  computeMerchantPaymentHash,
  computeTransactionStatusHash,
  computeBankDepositHash,
  computecreateAccountHash,
  computeBankValidateHash,
  //  createHashToCompare,
   computeVerifiedAirtimeHash,
   computeToCompareHash,
  computeVerifiedHash
};


