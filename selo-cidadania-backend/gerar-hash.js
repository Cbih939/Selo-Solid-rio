const bcrypt = require('bcrypt');

const senha = 'Energiz@ndoVidas25';
const hash = bcrypt.hashSync(senha, 10);

console.log(hash);
