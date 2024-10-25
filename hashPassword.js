const bcrypt = require("bcryptjs");

async function generatePasswordHash() {
  const password = "aSenha"; //  (exTensaoFernanda$)
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Senha criptografada:", hashedPassword);
}

generatePasswordHash();
