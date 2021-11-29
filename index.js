// Vamos construir um servidor usando um modulo do Express.
// Este modulo possue funções para executar e manipular um servidor node
// iniciaremos criando uma referência do express com a importação do modulo
const express = require("express");


const cors = require('cors');


// Vamos importar o modulo mongoose que ferá a interface entre o
// nodejs e o banco de dados mongodb
const mongoose = require("mongoose");

// Importação do modulo bycrpt para criptografia de senhas
const bycrpt = require("bcrypt");



// Jsonwebtoken é um hash que garante a seção segura em uma página ou grupos de páginas
// permitinfo ou não o acesso aos conteúdo destas páginas. Ele é gerado a partir de alguns
// elementos, tals como: dados que importam ao token(payload), chave secreta, tempo de
// expiração e método de criptografia.
const  jwt  = require("jsonwebtoken");

const cfn = require("./config");
const { jwt_expires } = require("./config");


const url = "mongodb+srv://thiagoprado:vaicurintia1910@clustername.fpofj.mongodb.net/primeiraapi?retryWrites=true&w=majority";

mongoose.connect(url, {useNewUrlParser:true, useUnifiedTopology:true });


// Vamos criar uma estrutura da tabela cliente com o comando de Schema
const tabela = mongoose.Schema({
    nome:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    cpf:{type:String, required:true, unique:true},
    usuario:{type:String, required:true, unique:true},
    senha:{type:String, required:true}


});

// Aplicação da criptografia do bcrypt a tabela de cadastro
// de clientes será feita um passo antes do salvamento
// dos dados cliente
// vamos usar o comando pre
tabela.pre("save",function(next){
    let cliente = this;
    if(!cliente.isModified('senha')) return next()
    bycrpt.hash(cliente.senha,10,(erro,rs)=>{
        if(erro) return console.log(`erro ao gerar senha ->${erro}`);
        cliente.senha = rs;
        return next();
    }) 
})

// execução de tabela
const Cliente = mongoose.model("tbcliente",tabela);

// criar uma refêrencia do servidor express para utilizá-lo
const app = express();
app.use(cors());
// fazer o servidor express receber e tratar dados em formato json
app.use(express.json());

/*
Abaixo, iremos criar as 4 rotas para os verbos GET, POST, PUT, DEELTE:
   - GET -> Esse verbo é utilizado todas as vezes que o usuário requisita
   alguma informação ao servidor e, este por sua vez responde;

   - POST -> É utilizado todas vezes que o usuário quiser cadastrar um cliente
   ou enviar um dado importante ao servidor.

   - PUT -> É usado quando se deseja atualizar algum dados sobre um objeto.

   - DELETE -> É usado para apagar um dados sobre um objeto.

Ao final das rotas iremos aplicar ao servidor uma porta de comunicação. No nosso
caso será a porta 3000.
*/



app.get("/api/cliente/", verifica,(req,res)=>   {
    Cliente.find((erro,dados)=>{
        if(erro){
            return res.status(400).send({output:`Erro ao tentar ler os clientes -> ${erro}`});
        }
        res.status(200).send({output:dados});
    }

    );
});




app.get("/api/cliente/:id",(req,res)=>{
    Cliente.findById(req.params.id,(erro,dados)=>{
        if(erro){
            return res.status(400).send({output:`Erro ao tentar ler os clientes -> ${erro}`});
        }
        res.status(200).send({output:dados});
    }

    );
});



app.post("/api/cliente/cadastro",(req,res)=>{

    const cliente = new Cliente(req.body);
    cliente.save().then(()=>{
        const gerado = criaToken(req.body.usuario,req.body.nome);
        res.status(201).send({output:`Cliente cadastrado`,token:gerado});
    })
    .catch((erro)=>res.status(400).send({output:`Erro ao tentar cadastradar o cliente`,message:erro}))

});

app.post("/api/cliente/login",(req,res)=>{
    const us = req.body.usuario;
    const sh = req.body.senha;
    Cliente.findOne({usuario:us},(erro,dados)=>{
        if(erro){
            return res.status(400).send({output:`Usuário não localizado->${erro}`});
        }
        bycrpt.compare(sh,dados.senha,(erro,igual)=>{
            if(erro) return res.status(400).send({output:`Erro ao tentar logar->${erro}`});
            if(!igual) return res.status(400).send({output:`Erro ao tentar logar->${erro}`});
            const gerado = criaToken(dados.usuario,dados.nome);
            res.status(200).send({output:`Logado`,payload:dados,token:gerado});
        })
    });
});




app.put("/api/cliente/atualizar/:id", verifica,(req,res)=>{
    Cliente.findByIdAndUpdate(req.params.id,req.body,(erro,dados)=>{
        if(erro){
            return res.status(400).send({output:`Erro ao tentar atualizar -> ${erro}`});
        }
        res.status(200).send({output:`Dados atualizados`});
    })
});

app.delete("/api/cliente/apagar/:id", verifica,(req,res)=>{
    Cliente.findByIdAndDelete(req.params.id,(erro,dados)=> {
        if(erro){
            return res.status(400).send({output:`Erro ao tentar apagar o cliente -> ${erro}`});
        }
        res.status(204).send({});
    })
});


// gerar token
const criaToken=(usuario, nome)=>{
    return jwt.sign({usuario:usuario,nome:nome},cfn.jwt_key,{expiresIn:cfn.jwt_expires});
};

// validação do token
function verifica (req,res,next){
    const token_gerado = req.headers.token;
    if(!token_gerado){
        return res.status(401).send({output:"Não há token"});
    }
    jwt.verify(token_gerado,cfn.jwt_key,(erro,dados)=>{
        if(erro){
            return res.status(401).send({output:"Token inválido"});
        }
        next();
    });
};


app.listen(3000,()=>console.log("Servidor online em http://localhost:3000"));
