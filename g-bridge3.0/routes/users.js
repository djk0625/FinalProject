const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   bcrypt  = require('bcrypt-nodejs');
const   multer = require('multer');
const   async = require('async');
const   url = require('url');
const   upload = multer({dest: __dirname + '/../public/images/uploads/products'});
const   router = express.Router();


const   db = mysql.createConnection({
    host: 'localhost',        // DB서버 IP주소
    port: 3306,               // DB서버 Port주소
    user: 'root',             // DB접속 아이디
    password: 'ehdwn12',     // DB암호
    database: 'project',      //사용할 DB명
    multipleStatements: true // 다중쿼리
});

const methodoverride = require('method-override');
router.use(methodoverride('_method'));
router.use(bodyParser.urlencoded({ extended: false }));


//  -----------------------------------  회원가입기능 -----------------------------------------
// 회원가입 입력양식을 브라우져로 출력합니다.
const PrintRegistrationForm = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/reg_form.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
           'talregurl': '/adminprod/talreg',
            'talreglabel' : '재능등록',
                                             'logurl': '/users/logout',
                                             'loglabel': '로그아웃',
                                             'regurl': '/users/profile',
                                             'reglabel':req.session.who,
                                             'uidurl': '/users/profile',
                                             'uidlabel':req.session.uid,
                                             'upwdlabel':req.session.upwd,
                                             'upnumlabel':req.session.upnum,
                                             'ubirthlabel':req.session.ubirth }));
       }
       else {
          res.end(ejs.render(htmlstream, { 'title' : '쇼핑몰site',
          'talregurl': '/adminprod/talreg',
           'talreglabel' : '재능등록',
                                          'logurl': '/users/auth',
                                          'loglabel': '로그인',
                                          'regurl': '/users/reg',
                                          'reglabel':'회원가입' }));
       }

};

// 회원가입 양식에서 입력된 회원정보를 신규등록(DB에 저장)합니다.
const HandleRegistration = (req, res) => {  // 회원가입
let body = req.body;
let htmlstream='';

    console.log(body.uid);     // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log(body.upwd);
    console.log(body.uname);

    if (body.uid == '' || body.upwd == '') {
         console.log("데이터입력이 되지 않아 DB에 저장할 수 없습니다.");
         res.status(561).end('<meta charset="utf-8">데이터가 입력되지 않아 가입을 할 수 없습니다');
    }
    else {

       db.query('INSERT INTO users (uid, uname, upwd, upnum, ubirth) VALUES (?, ?, ?, ?, ?)', [body.uid, body.uname, body.upwd, body.upnum, body.ubirth], (error, results, fields) => {
          if (error) {
            console.log(error);
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                               'warn_title':'회원가입 오류',
                               'warn_message':'이미 회원으로 등록되어 있습니다. 바로 로그인을 하시기 바랍니다.',
                               'return_url':'/' }));
          } else {
           console.log("회원가입에 성공하였으며, DB에 신규회원으로 등록하였습니다.!");
           res.redirect('/');
          }
       });

    }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/reg', PrintRegistrationForm);   // 회원가입화면을 출력처리
router.post('/reg', HandleRegistration);   // 회원가입내용을 DB에 등록처리
router.get('/', function(req, res) { res.send('respond with a resource 111'); });

// ------------------------------------  로그인기능 --------------------------------------

// 로그인 화면을 웹브라우져로 출력합니다.
const PrintLoginForm = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/login_form.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                             'talregurl': '/adminprod/talreg',
                                             'talreglabel' : '재능등록',
                                             'logurl': '/users/logout',
                                             'loglabel': '로그아웃',
                                             'regurl': '/users/profile',
                                             'reglabel': req.session.who,
                                             'uidurl': '/users/profile',
                                             'uidlabel':req.session.uid,
                                             'upwdlabel':req.session.upwd,
                                             'upnumlabel':req.session.upnum,
                                             'ubirthlabel':req.session.ubirth }));
       }
       else {
         res.end(ejs.render(htmlstream, { 'title' : '쇼핑몰site',
                                          'talregurl': '/adminprod/talreg',
                                          'talreglabel' : '재능등록',
                                          'logurl': '/users/auth',
                                          'loglabel': '로그인',
                                          'regurl': '/users/reg',
                                          'reglabel':'회원가입' }));
       }

};

//------------------------------------------- 로그인을 수행합니다. (사용자인증처리)---------------------------------
const HandleLogin = (req, res) => {
  let body = req.body;
  let uid, upwd, uname;
  let sql_str;
  let htmlstream = '';

      console.log(body.uid);
      console.log(body.upwd);
      if (body.uid == '' || body.upwd == '') {
         console.log("아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.");
         res.status(562).end('<meta charset="utf-8">아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.');
      }
      else {
       sql_str = "SELECT uid, upwd, uname, upnum, ubirth, useller, uaccount from users where uid ='"+ body.uid +"' and upwd='" + body.upwd + "';";
       console.log("SQL: " + sql_str);
       db.query(sql_str, (error, results, fields) => {
         if (error) { res.status(562).end("Login Fail as No id in DB!"); console.log(error)}
         else {
            if (results.length <= 0) {  // select 조회결과가 없는 경우 (즉, 등록계정이 없는 경우)
                  htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                  res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                               'warn_title':'로그인 오류',
                                                               'warn_message':'등록된 계정이 아니거나 아이디 또는 암호가 틀립니다.',
                                                               'return_url':'/' }));
             } else {  // select 조회결과가 있는 경우 (즉, 등록사용자인 경우)
               results.forEach((item, index) => {
                  uid = item.uid;  upwd = item.upwd; uname = item.uname; upnum = item.upnum; ubirth = item.ubirth;
                  useller = item.useller; uaccount = item.uaccount;
                  console.log("DB에서 로그인성공한 ID/암호:%s/%s", uid, upwd);

                  if (body.uid == uid && body.upwd == upwd) {
                     req.session.auth = 99;      // 임의로 수(99)로 로그인성공했다는 것을 설정함
                     req.session.uid = uid;
                     req.session.who = uname; // 인증된 사용자명 확보 (로그인후 이름출력용)
                     req.session.upwd = upwd;
                     req.session.upnum = upnum;
                     req.session.ubirth = ubirth;
                     req.session.useller = useller;
                     req.session.uaccount = uaccount;

                   if (body.uid == 'admin')    // 만약, 인증된 사용자가 관리자(admin)라면 이를 표시
                          req.session.admin = true;
                          res.redirect('/')
                  }
                }); /* foreach */
              } // else
            }  // else
       });
   }
}


// REST API의 URI와 핸들러를 매핑합니다.
//  URI: http://xxxx/users/auth
router.get('/auth', PrintLoginForm);   // 로그인 입력화면을 출력
router.post('/auth', HandleLogin);     // 로그인 정보로 인증처리

// ------------------------------  로그아웃기능 --------------------------------------

const HandleLogout = (req, res) => {
       req.session.destroy();     // 세션을 제거하여 인증오작동 문제를 해결
       res.redirect('/');         // 로그아웃후 메인화면으로 재접속
}

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/logout', HandleLogout);       // 로그아웃 기능


// --------------- 마이페이지화면을 출력 --------------------
const PrintProfile = (req, res) => {
let    htmlstream = '';
let    sql_str;

if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT uid, uname, upnum, ubirth from users WHERE uid = ?;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("PrintProfile : DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'사용자 조회 오류',
                                                                 'warn_message':'조회된 사용자이 없습니다.',
                                                                 'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        userdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'마이페이지 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
                                                    }
};
// ---------------내 정보 수정 화면을 출력---------------------------------
const PrintUserupdate = (req, res) => {
  let    htmlstream = '';
  let    sql_str;

  if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
             htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
             htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
             htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_update.ejs','utf8'); // 괸리자메인화면
             htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

             sql_str = "SELECT uid, uname, upnum, ubirth from users WHERE uid = ?;"; // 상품조회SQL
             res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

             db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 상품조회 SQL실행
                 if (error) { res.status(562).end("PrintUserupdate : DB query is failed"); }
                 else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                     htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                     res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                   'warn_title':'사용자 조회 오류',
                                                                   'warn_message':'조회된 사용자이 없습니다.',
                                                                   'return_url':'/' }));
                     }
                else {  // 조회된 상품이 있다면, 상품리스트를 출력
                       res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                         'talregurl': '/adminprod/talreg',
                                                         'talreglabel' : '재능등록',
                                                         'logurl': '/users/logout',
                                                         'loglabel': '로그아웃',
                                                         'regurl': '/users/profile',
                                                         'reglabel': req.session.who,
                                                          userdata : results }));  // 조회된 상품정보
                   } // else
             }); // db.query()
         }
         else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
           htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
           res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                        'warn_title':'마이페이지 화면 기능 오류',
                                                        'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                        'return_url':'/' }));
         }
};
//-----------------------마이페이지 사용자 정보 수정 기능 -----------------
const MypageUpdateUser = (req, res) => {  // 사용자 정보 변경
  let    body = req.body;
  let    htmlstream = '';

       if (body.upwd == req.session.upwd) {
         if (body.newpwd != body.newpwd_confirm) {
           console.log("변경하려는 비밀번호가 일치하지 않습니다.");
           res.status(561).end('<meta charset="utf-8">변경하려는 비밀번호가 일치하지 않습니다.');
        } else {
            db.query('UPDATE users SET upwd=?, upnum=? WHERE uid =?',
                  [body.newpwd, body.newpnum, req.session.uid], (error, results, fields) => {
             if (error) {
                 htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                 res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                              'warn_title':'사용자 정보 변경 오류',
                                                              'warn_message':'사용자 정보를 변경할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                                              'return_url':'/' }));
              } else {
                htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                             'warn_title':'사용자 정보 변경',
                                                             'warn_message':'사용자 정보가 변경되었습니다.',
                                                             'return_url':'/users/profile' }));
              }
         });
       }
      }
     else {
       htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
          res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                       'warn_title':'사용자 정보 변경 기능 오류',
                                                       'warn_message':'현재 비밀번호가 일치하지 않습니다. 다시 확인해주세요.',
                                                       'return_url':'/' }));
       }
};
// ---------------내 게시글 확인 화면을 출력---------------------------------
const PrintMyBoard = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  let    sql_str1;
  var    inum = req.params.inum;
  let    page = req.params.page;

  if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
      htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_board.ejs','utf8'); // 괸리자메인화면
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT inum, ititle, icomplete from inquiry WHERE uid = ? order by inum desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 상품조회 SQL실행
           if (error) { res.status(562).end("PrintMyBoard : DB query is failed");
         }
           else {
                     // 조회된 상품이 있다면, 게시판 리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        page : page,
                                                        page_num : 10,
                                                        leng : Object.keys(results).length,
                                                        boarddata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'마이페이지 - 내 게시글 확인 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };

//-----------------구매내역 화면 출력-----------
const PrintUserbuylist = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_buylist.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT * from deal where dbuyer=?"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("구매내역 조회 불가 !"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'구매내역조회 오류',
                                                                 'warn_message':'조회된 구매내역이 없습니다.',
                                                                 'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel':req.session.who,
                                                        buydata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'구매자 내역 조회 오류',
                                                      'warn_message':'로그인되어 있지 않아서, 구매내역 조회를 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//------------------------------구매내역 기능---------------------------------
const MypageBuylist = (req,res) => {
let    sql_str1;
let    body = req.body;

sql_str1 = "UPDATE deal SET dcomplete = ? WHERE dnum = ?";

    //console.log(typeof(body.usernum));
    if(typeof(body.dnum) == "string"){
      db.query(sql_str1, ["거래 완료", body.dnum], (error, results, fields) => {  // 상품조회 SQL실행
          if (error) {
              console.log(error);
              htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                            'warn_title':'거래상태 변경 오류',
                                                            'warn_message':'선택 된 재능이 없습니다.',
                                                            'return_url':'/' }));
          }else{
            res.redirect('/users/buylist');
          }
      }); // db.query()
    }else{
      async.waterfall([ // 여러명의 회원을 삭제할 경우에는 비동기식을 동기식으로 바꿔준다.
        function(callback){
          for(var i=0; i<body.dnum.length; i++){
            db.query(sql_str1, ["거래 완료", body.dnum[i]], (error, results, fields) => {  // 상품조회 SQL실행
                if (error) {
                    console.log(error);
                    htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                    res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                  'warn_title':'거래 상태 오류',
                                                                  'warn_message':'선택 된 재능이 없습니다.',
                                                                  'return_url':'/' }));
                    }
            }); // db.query()
          }
          callback(null);
        }
      ], function(error, result){
        if(error){
          console.log(error);
        }
      });
      res.redirect('/users/buylist');
    }
};

//----------------튜터 등록 화면 출력--------------
const PrintUserapptutor = (req, res) => {
let    htmlstream = '';
      if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
          htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_apptutor.ejs','utf8'); // 괸리자메인화면
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

          res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
          res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                            'talregurl': '/adminprod/talreg',
                                            'talreglabel' : '재능등록',
                                            'logurl': '/users/logout',
                                            'loglabel': '로그아웃',
                                            'regurl': '/users/profile',
                                            'reglabel':req.session.who }));  // 세션에 저장된 사용자명표시
                                            }
         else {
               htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
               res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                            'warn_title':'마이페이지 기능 오류',
                                                            'warn_message':'로그인이 되어 있지 않아서, 마이페이지 기능을 사용할 수 없습니다.',
                                                            'return_url':'/' }));
              }
};
//----------------튜터 등록 기능 ------------------------
const TutorRegistration = (req, res) => {  // 튜터 등록
let body = req.body;
let htmlstream='';

    if (body.uaccount == '') {
         console.log("사용자 계좌 번호가 입력이 되지 않아 DB에 저장할 수 없습니다.");
         res.status(561).end('<meta charset="utf-8">사용자 계좌 번호가 입력이 되지 않아 튜터 등록이 불가능합니다.');
    }
    else {
       db.query('UPDATE users SET useller=1, uaccount=? where uid=?',
          [body.uaccount, req.session.uid], (error, results, fields) => {
          if (error) {
            console.log(error);
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                         'warn_title':'오류',
                                                         'warn_message':'튜터 등록시 오류가 발생하였습니다.',
                                                         'return_url':'/' }));
          } else {
              htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                           'warn_title':'튜터 등록 완료',
                                                           'warn_message':'튜터 등록이 완료되었습니다.!!',
                                                           'return_url':'/' }));
          }
       });

    }
};
// ---------------재능 관리 화면을 출력---------------------------------
const PrintTalentmanage = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;


      if (req.session.auth && (req.session.useller == 1))   {   // 관리자로 로그인된 경우에만 처리한다
      htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_talmanage.ejs','utf8'); // 괸리자메인화면
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

      sql_str = "SELECT * from talent WHERE uid = ? order by tnum desc;"; // 상품조회SQL
      res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

      db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 상품조회 SQL실행
        if (error) { res.status(562).end("PrintMyBoard : DB query is failed");
         } else {  // 조회된 상품이 있다면, 상품리스트를 출력

                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        page : page,
                                                        page_num : 10,
                                                        leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'마이페이지 - 내 게시글 확인 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };

//-----------------------------------------거래정보수정 화면 출력-----------------------------------
const  PrintUsertalupdate = (req, res) => {
let    htmlstream = '';
let    htmlstream2 = '';
let    sql_str= '';
var    tnum = req.params.tnum;
let    page = req.params.page;


         if (req.session.auth && (req.session.useller == 1)) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_talupdate.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         sql_str = "SELECT * from talent where tnum = ?;";
         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         db.query(sql_str, [tnum], (error, results, fields) => {  // 사용자조회 SQL실행
             if (error) {res.status(562).end("PrintBoardForm: DB query is failed"); }
             else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                 htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                 res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                               'warn_title':'게시판 조회 오류',
                                                               'warn_message':'조회된 문의글이 없습니다.',
                                                               'return_url':'/' }));
                 }else{

                   res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                     'talregurl': '/adminprod/talreg',
                                                     'talreglabel' : '재능등록',
                                                     'logurl': '/users/logout',
                                                     'loglabel': '로그아웃',
                                                     'regurl': '/users/profile',
                                                     'reglabel':req.session.who,
                                                      page : page,
                                                      page_num : 10,
                                                      leng : Object.keys(results).length,
                                                      tdata : results }));  // 조회된 상품정보
                 } // else

             }); // db.query()
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'상품등록기능 오류',
                                                      'warn_message':'튜터로 로그인되어 있지 않아서, 재능 수정 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

};
//----------------거래정보수정 기능-------------------------------------
//----------------거래정보수정 기능-------------------------------------
const MypageTalupdate = (req, res) => {  // 상품등록
  let    body = req.body;
  let    sql_str= '';
  var    tnum = req.params.tnum;
  let    page = req.params.page;
  let    htmlstream = '';
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  let    result = { originalName  : picfile.originalname,
                    size : picfile.size     }

       console.log(body);     // 이병문 - 개발과정 확인용(추후삭제).
       console.log(tnum);
       if (req.session.auth && (req.session.useller == 1)) {
           if (body.ttitle == '' || body.tcategory == '' || body.tplace == '' || body.tprice == '') {
             console.log("입력되지 않은 정보가 있어서 수정이 불가능 합니다.");
             res.status(561).end('<meta charset="utf-8">입력되지 않은 정보가 있어서 등록이 불가능 합니다.');
          }
          else {
              prodimage = prodimage + picfile.filename;
              regdate = new Date();
              sql_str = "UPDATE talent SET ttitle =?, tcategory =?, tcomment=?, texplanation=?, tplace=?, tprice=?, tpic=?, tdate=now() WHERE tnum =?"
              db.query(sql_str,
                    [body.new_ttitle, body.new_tcategory, body.new_tcomment, body.new_texplanation, body.new_tplace, body.new_tprice, prodimage, tnum], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                                'warn_title':'재능수정 오류',
                                                                'warn_message':'재능을 수정할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                                                'return_url':'/' }));
                } else {
                   console.log(db.query);
                   console.log("재능수정에 성공하였으며, DB에 재능수정을 완료하였습니다.!");
                   res.redirect('/');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'상품등록기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//----------------판매내역 화면 출력--------------
const PrintUserselllist = (req, res) => {
let    htmlstream = '';
let    page = req.params.page;
var    inum = req.params.inum;

if (req.session.auth && (req.session.useller == 1)) { // 관리자로 로그인된 경우에만 처리한다
htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_selllist.ejs','utf8'); // 괸리자메인화면
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
sql_str = "SELECT * from deal where dseller =?;";

res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 사용자조회 SQL실행
    if (error) {res.status(562).end("PrintBoardForm: DB query is failed"); }
    else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
        htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                      'warn_title':'거래내역 기능 오류',
                                                      'warn_message':'조회된 거래 내역이 없습니다.',
                                                      'return_url':'/' }));


        }else{
          res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                            'talregurl': '/adminprod/talreg',
                                            'talreglabel' : '재능등록',
                                            'logurl': '/users/logout',
                                            'loglabel': '로그아웃',
                                            'regurl': '/users/profile',
                                            'reglabel':req.session.who,
                                             page : page,
                                             page_num : 10,
                                             leng : Object.keys(results).length,
                                             selldata : results }));  // 조회된 상품정보
        } // else
    }); // db.query()
}
else {
htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                             'warn_title':'거래 내역 기능 오류',
                                             'warn_message':'로그인 되어있지 않거나 튜터로 등록되어있지 않아서 기능을 사용할 수 없습니다.',
                                             'return_url':'/' }));
}

};
//----------------판매내역(거래중인) 화면 출력--------------
const PrintUserselllistNotComplete = (req, res) => {
let    htmlstream = '';
let    page = req.params.page;
var    inum = req.params.inum;

if (req.session.auth && (req.session.useller == 1)) { // 관리자로 로그인된 경우에만 처리한다
htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_selllist_Notcomp.ejs','utf8'); // 괸리자메인화면
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
sql_str = "SELECT * from deal where dseller = ? and dcomplete = '거래중' order by ddate desc";

res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 사용자조회 SQL실행
    if (error) {res.status(562).end("PrintBoardForm: DB query is failed"); }
    else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
        htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                      'warn_title':'판매내역 기능 오류',
                                                      'warn_message':'조회된 판매내역이 없습니다.',
                                                      'return_url':'/' }));


        }else{
          res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                            'talregurl': '/adminprod/talreg',
                                            'talreglabel' : '재능등록',
                                            'logurl': '/users/logout',
                                            'loglabel': '로그아웃',
                                            'regurl': '/users/profile',
                                            'reglabel':req.session.who,
                                             page : page,
                                             page_num : 10,
                                             leng : Object.keys(results).length,
                                             selldata : results }));  // 조회된 상품정보
        } // else
    }); // db.query()
}
else {
htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                             'warn_title':'거래 내역 기능 오류',
                                             'warn_message':'로그인 되어있지 않거나 튜터로 등록되어있지 않아서 기능을 사용할 수 없습니다.',
                                             'return_url':'/' }));
}

};
//----------------판매내역(거래완료) 화면 출력--------------
const PrintUserselllistComplete = (req, res) => {
let    htmlstream = '';
let    page = req.params.page;
var    inum = req.params.inum;

if (req.session.auth && (req.session.useller == 1)) { // 관리자로 로그인된 경우에만 처리한다
htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_selllist_comp.ejs','utf8'); // 괸리자메인화면
htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
sql_str = "SELECT * from deal where dseller = ? and dcomplete = '거래 완료' order by ddate desc";

res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
db.query(sql_str, [req.session.uid], (error, results, fields) => {  // 사용자조회 SQL실행
    if (error) {res.status(562).end("PrintBoardForm: DB query is failed"); }
    else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
        htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                      'warn_title':'판매내역 기능 오류',
                                                      'warn_message':'조회된 판매내역이 없습니다.',
                                                      'return_url':'/' }));


        }else{
          res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                            'talregurl': '/adminprod/talreg',
                                            'talreglabel' : '재능등록',
                                            'logurl': '/users/logout',
                                            'loglabel': '로그아웃',
                                            'regurl': '/users/profile',
                                            'reglabel':req.session.who,
                                             page : page,
                                             page_num : 10,
                                             leng : Object.keys(results).length,
                                             selldata : results }));  // 조회된 상품정보
        } // else
    }); // db.query()
}
else {
htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                             'warn_title':'거래 내역 기능 오류',
                                             'warn_message':'로그인 되어있지 않거나 튜터로 등록되어있지 않아서 기능을 사용할 수 없습니다.',
                                             'return_url':'/' }));
}

};
// ---------------회원탈퇴 화면을 출력---------------------------------
const PrintUserdel = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypage_userdel.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                             'talregurl': '/adminprod/talreg',
                                             'talreglabel' : '재능등록',
                                             'logurl': '/users/logout',
                                             'loglabel': '로그아웃',
                                             'regurl': '/users/profile',
                                             'reglabel': req.session.who }));
       }
       else {
                 htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                 res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                              'warn_title':'마이페이지 기능 오류',
                                                              'warn_message':'로그인이 되어 있지 않아서, 마이페이지 기능을 사용할 수 없습니다.',
                                                              'return_url':'/' }));
       }
};
// ---------------회원탈퇴 기능---------------------------------
const MypageDeleteUser = (req, res) => {  // 튜터 등록
let body = req.body;
let htmlstream='';

    if ((body.uid == req.session.uid) && (body.upwd == req.session.upwd)) {
          db.query('DELETE FROM users WHERE uid = ?',
          [body.uid,], (error, results, fields) => {
          if (error) {
            console.log(error);
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                               'warn_title':'오류',
                               'warn_message':'회원 정보 삭제시 오류가 발생하였습니다.',
                               'return_url':'/' }));
          } else {
              htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                           'warn_title':'회원 탈퇴 완료',
                                                           'warn_message':'회원 탈퇴가 완료되었습니다.!!',
                                                           'return_url':'/' }));

          }
       });

    }
};
//-------------------------------------------URI 기능 --------------------------------------------
router.get('/profile', PrintProfile);          // 마이페이지화면을 출력
router.get('/board/:page', PrintMyBoard);            // 마이페이지-내 게시글 확인 화면을 출력
router.get('/update', PrintUserupdate);        // 마이페이지-내정보수정화면을 출력
router.put('/mypageupdate', MypageUpdateUser); // 마이페이지-내정보수정 기능
router.get('/buylist', PrintUserbuylist);      // 마이페이지-구매내역화면을 출력
router.put('/buylist', MypageBuylist);      // 마이페이지-거래상태변경 기능
router.get('/apptutor', PrintUserapptutor);    // 마이페이지-튜터등록화면을 출력
router.post('/apptutor', TutorRegistration);   // 마이페이지-튜터등록 기능
router.get('/talmanage/:page', PrintTalentmanage);  // 마이페이지-재능 관리 화면을 출력
router.get('/talupdate/:tnum', PrintUsertalupdate);  // 마이페이지-재능정보수정화면을 출력
router.put('/talupdate/:tnum', upload.single('tpic'), MypageTalupdate);     // 마이페이지-재능정보수정 기능
router.get('/selllist/:page', PrintUserselllist);    // 마이페이지-판매내역화면을 출력
router.get('/notcomplete/:page', PrintUserselllistNotComplete);    // 마이페이지-판매내역화면을 출력
router.get('/complete/:page', PrintUserselllistComplete);    // 마이페이지-판매내역화면을 출력
router.get('/userdel', PrintUserdel);          // 마이페이지-회원탈퇴화면을 출력
router.delete('/userdel', MypageDeleteUser);   // 마이페이지 - 회원탈퇴 기능

module.exports = router;
