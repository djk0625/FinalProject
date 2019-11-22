const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   url = require('url');
const   session = require('express-session');
const   multer = require('multer');
const   async = require('async');
const   upload = multer({dest: __dirname + '/../public/images/uploads/products'});  // 업로드 디렉터리를 설정한다.
const   router = express.Router();
const   pool   = require('pool');
const   path   = require('path');
const   connection = require('connection');

router.use(bodyParser.urlencoded({ extended: true }));

const   db = mysql.createConnection({
  host: 'localhost',        // DB서버 IP주소
  port: 3306,               // DB서버 Port주소
  user: 'root',            // DB접속 아이디
  password: 'ehdwn12',  // DB암호
  database: 'project'         //사용할 DB명
});

const methodoverride = require('method-override');
router.use(methodoverride('_method'));
router.use(bodyParser.urlencoded({ extended: false }));

// (관리자용) ----------------------회원리스트기능 ----------------------------------------------------
const AdminPrintUser = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/userslist.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT uname, uid, pwd, uadd, uphone, upoint from u29_users order by uname desc"; // 회원조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 회원조회 SQL실행
               if (error) { res.status(562).end("AdminPrintUser: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 회원이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                      'warn_title':'회원조회 오류',
                                      'warn_message':'조회된 회원이 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 회원이 있다면, 회원리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        prodata : results }));  // 조회된 회원정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'회원리스트기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 회원리스트 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};
//사용자 정보 변경 리스트 출력
const UpdatePrintUser = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_alter.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT uname, uid, pwd, uadd, uphone, upoint from u29_users where uid != 'admin'"; // 회원조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 회원조회 SQL실행
               if (error) { res.status(562).end("AdminPrintUser: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 회원이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                      'warn_title':'회원조회 오류',
                                      'warn_message':'조회된 회원이 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 회원이 있다면, 회원리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        userdata : results }));  // 조회된 회원정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'회원리스트기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 회원리스트 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};
// 사용자 정보 DB 변경
const HanldleUpdateUser = (req, res) => {  // 사용자 정보 변경
  let    body = req.body;
  let    htmlstream = '';

       if (req.session.auth && req.session.admin) {
           if (body.uid == '') {
             console.log("사용자 번호가 입력되지 않아 정보를 변경 할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">사용자 번호가 입력되지 않아 변경할 수 없습니다');
          }
          else {
              db.query('UPDATE u29_users SET uname =?, pwd =?, uadd =?, uphone =?, upoint =? WHERE uid =?',
                    [body.uname, body.pwd, body.uadd, body.uphone, body.upoint, body.uid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'사용자 정보 변경 오류',
                                 'warn_message':'사용자 정보를 변경할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("사용자 정보변경에 성공하였으며, DB에 상품 정보를 변경하였습니다.!");
                   res.redirect('/adminuser/list');
                }
           });
         }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'사용자 정보 변경 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 사용자 정보 변경 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};

//사용자 정보 삭제 리스트를 출력합니다.
const DeletePrintUser = (req, res) => {
  let    htmlstream = '';

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_delete.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         db.query('SELECT uid from u29_users', (error, results, fields) => {
          if (error) {
              htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'사용자 정보 삭제 오류',
                            'warn_message':'사용자 정보를 삭제할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                            'return_url':'/' }));
           } else {
              console.log("사용자 정보 삭제에 성공하였으며, DB에 사용자 정보를 삭제하였습니다.!");
              res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                'logurl': '/users/logout',
                                                'loglabel': '로그아웃',
                                                'regurl': '/users/profile',
                                                'reglabel': req.session.who,
                                                 userdata : results
                                               }));
              //res.redirect('/adminprod/list');
           }
      });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'사용자 정보 삭제 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 사용자 정보 삭제 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};
// 사용자 정보 삭제를 위한 db문
const HanldleDeleteUser = (req, res) => {  // 상품정보 삭제
  let    body = req.body;
  let    htmlstream = '';

       if (req.session.auth && req.session.admin) {
           if (body.uid == '') {
             console.log("사용자 아이디가 입력되지 않아 정보를 삭제 할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">사용자 아이디가 입력되지 않아 삭제할 수 없습니다');
          }
          else {
              db.query('DELETE FROM u29_users WHERE uid = ?', [body.uid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'사용자 정보 삭제 오류',
                                 'warn_message':'사용자 정보를 삭제할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("사용자 정보 삭제에 성공하였으며, DB에 상품 정보를 삭제하였습니다.!");
                   res.redirect('/adminuser/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'사용자 정보 삭제 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 사용자 정보 삭제 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// ---------------------------------------------------------게시판 리스트 출력 --------------------------------------------------
const PrintBoardForm = (req, res) => {
   let    htmlstream = '';
   let    htmlstream2 = '';
   let    sql_str= '';
   let    page = req.params.page;
   var    inum = req.params.inum;

    if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
    htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/boardlist.ejs','utf8'); // 괸리자메인화면
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

    sql_str = "SELECT inum, ititle, uid, itype, idate from inquiry order by inum desc";

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
    db.query(sql_str, (error, results, fields) => {  // 사용자조회 SQL실행
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
                                                 idata : results }));  // 조회된 상품정보
            } // else

        }); // db.query()
  }
  else {
    htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
    res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                 'warn_title':'문의 등록 기능 오류',
                                                 'warn_message':'사용자로 로그인되어 있지 않아서, 문의 등록 기능을 사용할 수 없습니다.',
                                                 'return_url':'/' }));
                                               }
};
//-------------------------------------------------------게시글 작성하기 화면 출력 ------------------------------------------------
const AddWriteForm = (req, res) => {
  let    htmlstream = '';

       if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/boardinquiry.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                           'talregurl': '/adminprod/talreg',
                                           'talreglabel' : '재능등록',
                                           'logurl': '/users/logout',
                                           'loglabel': '로그아웃',
                                           'regurl': '/users/profile',
                                           'reglabel':req.session.who
                                            }));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'게시판 기능 오류',
                            'warn_message':'사용자로 로그인되어 있지 않아서, 게시글 등록 기능을 사용할 수 없습니다.',
                            'return_url':'/adminuser/boardlist/1' }));
       }

};
//------------------------------------------------------게시글 작성하기 기능-------------------------------------------------
const HandleAddWriteForm = (req, res) => {  // 상품등록
  let    sql_str;
  let    body = req.body;
  let    htmlstream = '';
  let    page = req.params.page;

       console.log(body);     // 이병문 - 개발과정 확인용(추후삭제).

       if (req.session.auth) {
           if (body.ititle == '') {
             console.log("게시글 제목이 입력되지 않아 DB에 저장할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">게시글 제목이 입력되지 않았습니다.');
          }
          else {
              sql_str = "INSERT INTO inquiry(uid, ititle, itype, iquestion, idate, icomplete) values(?,?,?,?, now(), '답변중')"
              db.query(sql_str, [req.session.uid, body.ititle, body.itype, body.iquestion], (error, results, fields) => {
               if (error) {
                   console.log(error);
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'게시글 등록 오류',
                                 'warn_message':'게시글로 등록할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("게시글 등록에 성공하였으며, DB에 신규 게시글로 등록하였습니다.!");
                   res.redirect('/adminuser/boardlist/1');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'게시글 등록기능 오류',
                                                      'warn_message':'사용자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//----------------------------------------------게시글 정보 상세확인------------------------------------------------------
const PrintDetailForm = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str= '';
  let    page = req.params.page;
  var    inum = req.params.inum;

   if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
   htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/boarddetail.ejs','utf8'); // 괸리자메인화면
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

   sql_str = "SELECT ititle, uid, itype, iquestion, ireply from inquiry where inum =? ;";

   res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
   db.query(sql_str, [inum], (error, results, fields) => {  // 사용자조회 SQL실행
       if (error) {res.status(562).end("PrintMessageForm: DB query is failed"); }
       else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
           htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
           res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                              'warn_title':'게시판 조회 오류',
                              'warn_message':'조회된 답변이 없습니다.',
                              'return_url':'/' }));


           }else{
             res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                               'talregurl': '/adminprod/talreg',
                                               'talreglabel' : '재능등록',
                                               'logurl': '/users/logout',
                                               'loglabel': '로그아웃',
                                               'regurl': '/users/profile',
                                               'reglabel':req.session.who,
                                                idata : results
                                               }));  // 조회된 상품정보
           } // else
       }); // db.query()
 }
 else {
   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                      'warn_title':'문의 등록 기능 오류',
                      'warn_message':'사용자로 로그인되어 있지 않아서, 문의 등록 기능을 사용할 수 없습니다.',
                      'return_url':'/' }));
 }
};
// ---------------------------------------------------------재능 문의 리스트 출력 --------------------------------------------------
const PrintBoardTalent = (req, res) => {
   let    htmlstream = '';
   let    htmlstream2 = '';
   let    sql_str= '';
   var inum = req.params.inum;
   let    page = req.params.page;

    if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
    htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/board_talent.ejs','utf8'); // 괸리자메인화면
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

    sql_str = "SELECT inum, ititle, uid, itype, idate from inquiry where itype = '재능 문의' order by inum desc;";

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
    db.query(sql_str, (error, results, fields) => {  // 사용자조회 SQL실행
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
                                                 idata : results }));  // 조회된 상품정보
            } // else
        }); // db.query()
  }
  else {
    htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
    res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                       'warn_title':'문의 등록 기능 오류',
                       'warn_message':'사용자로 로그인되어 있지 않아서, 문의 등록 기능을 사용할 수 없습니다.',
                       'return_url':'/' }));

}
};
// ---------------------------------------------------------입금 문의 리스트 출력 --------------------------------------------------
const PrintBoardDeposit = (req, res) => {
   let    htmlstream = '';
   let    htmlstream2 = '';
   let    sql_str= '';
   var inum = req.params.inum;
   let    page = req.params.page;

    if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
    htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/board_deposit.ejs','utf8'); // 괸리자메인화면
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

    sql_str = "SELECT inum, ititle, uid, itype, idate from inquiry where itype = '입금 문의' order by inum desc";

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
    db.query(sql_str, (error, results, fields) => {  // 사용자조회 SQL실행
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
                                                 idata : results }));  // 조회된 상품정보
            } // else
        }); // db.query()
  }
  else {
    htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
    res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                       'warn_title':'문의 등록 기능 오류',
                       'warn_message':'사용자로 로그인되어 있지 않아서, 문의 등록 기능을 사용할 수 없습니다.',
                       'return_url':'/' }));

}
};
// ---------------------------------------------------------기타 문의 리스트 출력 --------------------------------------------------
const PrintBoardEtc = (req, res) => {
   let    htmlstream = '';
   let    htmlstream2 = '';
   let    sql_str= '';
   var inum = req.params.inum;
   let    page = req.params.page;

    if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
    htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/board_etc.ejs','utf8'); // 괸리자메인화면
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

    sql_str = "SELECT inum, ititle, uid, itype, idate from inquiry where itype = '기타 문의' order by inum desc limit 10;";

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
    db.query(sql_str, (error, results, fields) => {  // 사용자조회 SQL실행
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
                                                 idata : results }));  // 조회된 상품정보
            } // else
        }); // db.query()
  }
  else {
    htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
    res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                       'warn_title':'문의 등록 기능 오류',
                       'warn_message':'사용자로 로그인되어 있지 않아서, 문의 등록 기능을 사용할 수 없습니다.',
                       'return_url':'/' }));

}
};
// REST API의 URI와 핸들러를 매핑합니다.
router.get('/read/:inum', PrintDetailForm); //게시글 상세보기 페이지 화면
router.post('/write', HandleAddWriteForm); // 게시글 작성하기 기능
router.get('/write', AddWriteForm);        // 게시글 작성하기 페이지 화면
router.get('/boardlist/:page', PrintBoardForm);  // 게시판 리스트 화면
router.get('/boardtalent/:page', PrintBoardTalent); // 게시판 재능 문의 리스트 화면
router.get('/boarddeposit/:page', PrintBoardDeposit); // 게시판 입금 문의 리스트 화면
router.get('/boardetc/:page', PrintBoardEtc); // 게시판 기타 문의 리스트 화면

// router.get('/list', AdminPrintUser); // 회원리스트를 화면에 출력
// router.get('/usersalter', UpdatePrintUser); // 사용자 정보 변경 리스트를 화면에 출력
// router.put('/alter', HanldleUpdateUser); // 사용자 정보 변경 db
// router.get('/usersdelete', DeletePrintUser); // 사용자 정보 삭제 리스트를 화면에 출력
// router.delete('/delete', HanldleDeleteUser); // 사용자 정보 삭제 db
// router.get('/', function(req, res) { res.send('respond with a resource 111'); });

module.exports = router;
