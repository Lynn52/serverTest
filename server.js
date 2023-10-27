const dotenv = require('dotenv').config();

//몽고DB 접속 코드
var mongodbClient = require('mongodb').MongoClient;
const url = process.env.DB_URL; //프로세스가 env 파일에 접근하여 DB_URL 값을 읽어오는 원리
const ObjId = require('mongodb').ObjectId;

let mydb;

mongodbClient.connect(url)
    //client 객체를 콜백함수로 받기
    .then(client => {
        mydb = client.db('myboard'); //몽고db 내 myboard라는 데이터베이스에 접근하겠다는 뜻
        
        http.listen(process.env.PORT, function(){
            console.log("포트 8080 서버 대기 중..."); //비동기 방식으로 처리되기에 이 문자열이 먼저 출력된다.
        })
    })
    .catch(err =>{
        console.log(err);
    })
    

const express = require('express');
const app = express(); //app 변수에 express 객체 전달
const {MongoClient} = require("mongodb");

//websocket 세팅 방법
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);

let imagepath = '';

//정적 파일을 제공할 디렉토리 지정
app.use('/public', express.static('public'));

//body-parser 라이브러리 가져오기
const bodyParser = require("body-parser");
//body-parser 미들웨어 추가
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

//cookie-parser  미들웨어 추가
let cookieParser = require('cookie-parser');
app.use(cookieParser('asdfefsvsdvsdds2344'));
//cookie 라우터 생성
app.get('/cookie', function(req, res){
    let milk = parseInt(req.signedCookies.milk) + 1000;
    if(isNaN(milk)){
        milk = 0;
    }

    res.cookie('milk', milk, {signed : true}); //쿠키 생성
    res.send('product : ' + milk + '원'); //쿠키를 브라우저로 전송
})

app.get('/clear', function(req, res){
    res.clearCookie('milk');
    res.send('쿠키가 제거되었습니다.');
})

//express-session 미들웨어 추가
let session = require('express-session');
app.use(session({
    secret : 'sdfasefasdfs234',
    resave : false, //세션 요청 시마다 세션 식별자 발급되는 것 막음
    saveUninitialized : true //세션 사용 전까지는 세션 식별자 발급 막음

}));

//세션 라우터 추가
app.get('/session', function(req, res){
    let sessionMilk = parseInt(req.session.milk);
    if(isNaN(sessionMilk)){
        sessionMilk = 0;
    }
    sessionMilk = sessionMilk + 1000;
    res.send('product : ' + sessionMilk + '원');
})

//'/book' 요청 시 처리 코드
app.get('/book', function(req, res){  //요청 자체가 이벤트, 콜백 함수를 통해 이벤트 처리
    console.log("도서 목록 관련 페이지입니다.");
    res.send("도서 목록 관련 페이지입니다.");
})

app.get('/', function(req, res){
    //res.sendFile(__dirname + '/index.html');
    res.render("index.ejs", {user : null});
})

app.get('/list', function(req, res){
    mydb.collection("post").find().toArray()
        .then(result=>{
            console.log(result);
            //data라는 키 값으로 서버가 ejs에 데이터를 바인딩 시킬 것이다.
            res.render('list.ejs', {data : result});
        })
    
    //res.sendFile(__dirname + '/list.html');
      
})

app.get('/enter', function(req, res){
    //res.sendFile(__dirname + '/enter.html');
    res.render('enter.ejs');
})

app.post('/save', function(req, res){
    console.log(req.body.title);
    console.log(req.body.content);
    console.log(req.body.someDate)
    console.log("저장 완료");

    //몽고DB에 데이터 저장하기
    mydb.collection('post').insertOne(
        {
            title : req.body.title,
            content : req.body.content,
            date : req.body.someDate,
            path : imagepath
        }
    ).then(result=>{
        console.log(result);
        console.log('데이터 추가 성공');
    });
    res.redirect('/list');
})

app.post('/delete', function(req,res){
    console.log(req.body._id); //{_id : "652ca2c8b3b11eb3d5c97c59"}
    //deleteOne, deleteMany
    req.body._id = new ObjId(req.body._id);
    console.log(req.body._id);

    //몽고DB에 저장된 데이터 삭제하기
    mydb.collection('post').deleteOne(req.body)
    .then(result=>{
        console.log("삭제 완료");
        res.status(200).send(); //성공 시, 응답으로써 상태 코드 200을 전송한다.
    }).catch(err=>{
        console.log(err);
        res.status(500).send();
    })
})

//시맨틱 url의 사용
app.get('/content/:id', function(req, res){
    req.params.id = new ObjId(req.params.id);
    mydb.collection('post').findOne({_id : req.params.id})
    .then(result=>{
        console.log(result);
        res.render('content.ejs', {data : result});  
    })
})

//게시물 수정 요청 라우터 생성
app.get('/edit/:id', function(req,res){
    req.params.id = new ObjId(req.params.id);
    mydb.collection('post').findOne({_id : req.params.id})
    .then(result=>{
        console.log(result);
        res.render('edit.ejs', {data : result});
    })
})

//시맨틱 url을 쓰는 수정 페이지의 '/edit'는 get 방식의 요청
//하단의 post 방식의 요청은 수정하기 버튼 클릭 시 작동하는 코드
app.post('/edit', function(req, res){
    console.log(req.body);
    req.body.id = new ObjId(req.body.id);

    //몽고DB에 데이터 저장하기
    mydb.collection('post').updateOne(
        {_id : req.body.id},
        {$set : {title : req.body.title, content : req.body.content, date : req.body.someDate}}
    ).then(result=>{
        console.log('수정 완료');
        res.redirect('/list');
    }).catch(
        
    )
})

app.get('/login', function(req, res){
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        return res.render('index.ejs', {user : req.session.user});
    }else{
        return res.render('login.ejs');
    }
})

//post 방식 : url에 정보가 노출되지 않는다.
app.post('/login', function(req,res){
    //1. 브라우저에서 입력한 id, pw 가져오기
    console.log('아이디 : ' + req.body.userid);
    console.log('비밀번호 : ' + req.body.userpw);

    //2. DB에서 id, pw 가져오기
    //몽고DB에 데이터 저장하기
    mydb.collection('account').findOne(
        {
            userid : req.body.userid
        }
    ).then(result=>{
        if(result.userpw == req.body.userpw){
            req.session.user = req.body;
            console.log('새로운 로그인');
            return res.render('index.ejs', {user : req.session.user});
        }else{
            return res.render('login.ejs');   
        }
    })
    .catch(err=>{
        return res.send('입력된 회원 정보가 없습니다.');
    })
})

app.get('/logout', function(req, res){
    console.log('로그아웃');
    req.session.destroy(); //로그아웃 시, 세션 기록이 삭제된다.
    return res.render('index.ejs', {user : null});
})

//회원가입 기능 구현
// app.get('/signup', function(req, res){
//     console.log(req.session);
//     if(req.session.user){
//         console.log('세션 유지');
//         return res.render('index.ejs', {user : req.session.user});
//     }else{
//         return res.render('login.ejs');
//     }
// })


const sha = require('sha256');
app.get('/signup', function(req, res){
    res.render('signup.ejs');
})

//post 방식 : url에 정보가 노출되지 않는다.
app.post('/signup', async function(req,res){
    //1. 브라우저에서 입력한 id, pw 가져오기
    console.log('아이디 : ' + req.body.userid);
    console.log('비밀번호 : ' + req.body.userpw);
    console.log('소속 : ' + req.body.usergroup);
    console.log('이메일 : ' + req.body.useremail);

    if(!await mydb.collection('account').findOne({userid : req.body.id})){
        res.send("<script>alert('회원가입을 축하합니다! 로그인 페이지로 이동합니다.'); window.location.replace('/login');</script>");
        await mydb.collection('account').insertOne(
            {
                userid : req.body.userid,
                userpw : req.body.userpw,
                usergroup : req.body.usergroup,
                useremail : req.body.useremail
            }), ()=>{console.log("저장완료")}
    }else{
        res.send("<script>alert('이미 가입된 회원입니다.'); window.location.replace('/signup');</script>");
    }
    });


let multer = require('multer');

let storage = multer.diskStorage({
    destination : function(req, file, done){
        done(null, './public/image')
    },
    filename : function(req, file, done){
        done(null, file.originalname)
    }
})

let upload = multer({storage : storage});

//'picture' : enter.ejs의 이미지 파일 input 태그 name 속성
app.post('/photo', upload.single('picture'), function(req,res){
    console.log('서버에 파일 첨부하기');
    console.log(req.file.path);
    imagepath = '\\' + req.file.path; //윈도우에서는 폴더 구분자로 \ 사용
})

app.get('/search', function(req, res){
    console.log(req.query.value);
    let condition = [
        {
            $search : {
                index : 'bulletinSearch',
                text : {
                    query : req.query.value,
                    path : ['title', 'content']
                }
            }
        },
        {
            $sort : {_id : -1} //1은 오름차순, -1은 내림차순(최신 글부터 출력)
        },
        {
            $limit : 10 //가져올 데이터 개수 제한
        }
    ];
    mydb.collection('post').aggregate(condition).toArray()
    .then((result)=>{
        res.render("sresult.ejs", {data : result});
    })
    
    // .find({$text : {$search: req.query.value}}).toArray()
    // .then((result)=>{
    //     console.log(result);
    //     res.render("sresult.ejs", {data : result});
    // })
})

app.get('/socket', function(req, res){
    res.render('socket.ejs');
})

io.on('connection', function(socket){
    console.log('유저 접속');
    socket.on('user-send', function(data){
        console.log(data);
        //io.emit('broadcast', data);
        //모두에게 broadcast가 아니라 특정 id의 소켓 가진 클라이언트에게만 메시지 전송
        io.to(socket.id).emit('broadcast', data);
    })
    
    socket.on('room1-send', function(data){
         io.to('room1').emit('broadcast', data);
    })
    
    socket.on('joinroom',function(data){
        socket.join('room1');
    })
})