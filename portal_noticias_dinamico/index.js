const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
var session = require('express-session');
var bodyParser = require('body-parser');

const path = require('path');
const app = express();

const Posts = require('./Posts.js');



mongoose.connect('mongodb+srv://root:HthZ6jKqn5x1SmSC@cluster0.sotslrg.mongodb.net/dankicode?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
    console.log('Conectado com sucesso');
}).catch(function(err){
    console.log(err.message);
})

app.use( bodyParser.json() );       // to support JSON-encoded bodies 
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}));

app.use(session({secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));


app.get('/',(req,res)=>{
    
    if(req.query.busca == null){
        Posts.find({}).sort({'_id': -1}).exec(function(err,posts){
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0,100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria
                }
            });

            Posts.find({}).sort({'views': -1}).limit(3).exec(function(err,postsTop){
                postsTop = postsTop.map(function(val){
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0,100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }

                })
                res.render('home',{posts:posts,postsTop:postsTop});
             })
        })
    }else{

        Posts.find({titulo: {$regex: req.query.busca, $options:"i"}}, function(err,posts){
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0,100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria
                }
            })
            res.render('busca', {posts:posts, contagem:posts.lenght});
        })

    }

  
});


app.get('/:slug',(req,res)=>{
    //res.send(req.params.slug);
    Posts.findOneAndUpdate({slug: req.params.slug}, {$inc:{views:1}}, {new:true}, function(err,resposta){
        //console.log(resposta);
        if(resposta != null){
            Posts.find({}).sort({'views': -1}).limit(3).exec(function(err, postsTop){
                postsTop = postsTop.map(function(val){
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0,100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }

                })

                res.render('single', {noticia:resposta, postsTop:postsTop});
            })
        }else{
            res.redirect('/');
        }

        
    })
})

var usuarios = [{
    login: 'Daniel',
    senha: '123'
}]

app.post('/admin/cadastro',(req,res)=>{
    

    let formato = req.files.arquivo.name.split('.');
    var imagem = "";

    if(formato[formato.length - 1] == "jpg"){
        imagem = new Date().getTime()+'.jpg';
        req.files.arquivo.mv(__dirname+'/public/images/'+imagem);

    }else{
        fs.unlinkSync(req.files.arquivo.tempFilePath);

    }


    Posts.create({
        titulo: req.body.titulo_noticia,
        imagem: req.body.url_imagem,
        categoria: 'Nenhuma',
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor: "Admin",
        views: 0
    });
    res.send("Cadastrado com sucesso!");
    res.redirect('/admin/login')
})

app.get('/admin/deletar/:id', (req,res)=>{
    res.send("Deletado a noticia com id:" + req.params.id);
})

app.post('/admin/login',(req,res)=>{
    usuarios.map(function(val){
        if(val.login == req.body.login && val.senha == req.body.senha){
            req.session.login = 'Daniel';
            
        }
        
    })

    res.redirect('/admin/login');
})

app.get('/admin/login',(req,res)=>{
    if(req.session.login == null){
        res.render('admin-login');
        
    }else{
        res.render('admin-panel');
    }
    
})

app.listen(5000,()=>{
    console.log('server rodando!');
})