import crypto from 'crypto';


let generateSalt = rounds => {
    if (rounds >= 15) {
        throw new Error("Rounds value must be less that 15, current value is " + rounds);
    }
    if (typeof rounds !== 'number') {
        throw new Error('rounds parameter must be a number');
    }
    if (rounds == null) {
        rounds = 12;
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};
console.log("Generated salt: " + generateSalt(12))

let hasher = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        hashedpassword: value
    };
};

let hash = (password, salt) => {
    if (password == null || salt == null) {
        throw new Error('Must Provide both password and salt values');
    }
    if (typeof password !== 'string' || typeof salt !== 'string') {
        throw new Error('password must be a string and salt must either be a salt string or a number of rounds');
    }
    return hasher(password, salt);
};
console.log(hash('password', generateSalt(12)))

let compare = (password, hash) => {
    hash = {
        salt: '26572da58c7c',
        hashedpassword: 'e4a611231b2be4fee18101497fa7090d8c1154936bbf05da4c98b8a29917db7039766c44c85d4757f84b3e40b19256ac66b609f0b1e4b22d8081fbb74586e70d'
      }
    if (password == null || hash == null) {
        throw new Error('password and hash is required to compare');
    }
    if (typeof password !== 'string' || typeof hash !== 'object') {
        throw new Error('password must be a String and hash must be an Object');
    }
    let passwordData = hasher(password, hash.salt);
    if (passwordData.hashedpassword === hash.hashedpassword) {
        return true;
    }
    return false
};
console.log(compare('password'))

module.exports = {
    generateSalt,
    hash,
    compare
}


