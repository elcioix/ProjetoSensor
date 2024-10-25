const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express();
const path = require("path");

require("dotenv").config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);

mongoose.connect(
  "mongodb+srv://mentoria:1234567890@cluster0.ydbgt.mongodb.net/Dados_Fernanda?retryWrites=true&w=majority"
);

// Modelo de Usuário
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  isAdmin: Boolean,
});

const User = mongoose.model("User", userSchema);

// Middleware para permitir requisições CORS
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Modelo de Dados
const sensorSchema = new mongoose.Schema({
    dia: { type: String, required: true },
    hora: { type: String, required: true },
    volume: { type: Number, required: true },
    tempo: { type: Number, required: true }    
  });
  
  const SensorCollection = mongoose.model('Sensor', sensorSchema, 'Sensor');

//rota p/ testes p/ acessar os dados da coleção
app.get("/test-sensors", async (req, res) => {
  try {
    console.log('Requisição de teste para acessar dados de sensores recebida.');
    const sensorData = await SensorCollection.find({});
    console.log('Dados de sensores encontrados no teste:', sensorData);
    res.send(sensorData);
  } catch (err) {
    console.error('Erro ao buscar dados de sensores no teste:', err);
    res.status(500).send("Erro ao buscar dados de sensores no teste");
  }
});

// Rota de Autenticação
app.post("/login", async (req, res) => {
  console.log("Requisição de Login Recebida");
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    console.log("Falha no Login:  Credenciais inválidas");
    return res.status(400).send("Credenciais inválidas");
  }
  const role = user.isAdmin ? "admin" : "user"; // Define a role baseado no campo isAdmin
  const token = jwt.sign(
    { userId: user._id, role: role },
    process.env.JWT_SECRET
  );
  console.log("Login Bem-Sucedido");
  res.send({ token });
});

// Middleware de Autorização
function auth(role) {
  return (req, res, next) => {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (role && role !== decoded.role)
      return res.status(403).send("Acesso negado");
    req.user = decoded;
    next();
  };
}

// Rotas Administrativas
app.post("/users", auth("admin"), async (req, res) => {
    console.log('Requisição para Criar Usuário Recebida', req.body);
    const { email, password, isAdmin } = req.body; 
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, isAdmin });
    await newUser.save();
    console.log('Usuário Criado com Sucesso', newUser);
    res.send(newUser);
  });
  

  app.get("/data", auth(), async (req, res) => {
    try {
      console.log('Requisição para acessar dados de sensores recebida.');
      const sensorData = await SensorCollection.find({});
      console.log('Dados de sensores encontrados:', sensorData);
      res.send(sensorData);
    } catch (err) {
      console.error('Erro ao buscar dados de sensores:', err);
      res.status(500).send("Erro ao buscar dados");
    }
  });
  

app.post("/data", auth("admin"), async (req, res) => {
  // Código para inserir dados
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
