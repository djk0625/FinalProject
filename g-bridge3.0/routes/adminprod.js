const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   url = require('url');
const   multer = require('multer');
const   async = require('async');
const   upload = multer({dest: __dirname + '/../public/images/uploads/products'});  // 업로드 디렉터리를 설정한다.
const   router = express.Router();

const   db = mysql.createConnection({
    host: 'localhost',           // DB서버 IP주소
    port: 3306,                  // DB서버 Port주소
    user: 'root',                // DB접속 아이디
    password: 'ehdwn12',        // DB암호
    database: 'project',         //사용할 DB명
    multipleStatements : true    //다중쿼리
});

const methodoverride = require('method-override');
router.use(methodoverride('_method'));
router.use(bodyParser.urlencoded({ extended: false }));

//  -----------------------------------  상품리스트 기능 -----------------------------------------
// (관리자용) 등록된 상품리스트를 브라우져로 출력합니다.
const AdminPrintProd = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminproduct.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT itemid, category, maker, pname, modelnum, rdate, price, amount from u29_product order by rdate desc;"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("AdminPrintProd: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                      'warn_title':'상품조회 오류',
                                      'warn_message':'조회된 상품이 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        prodata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품등록기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};
//  -----------------------------------  상품등록기능 -----------------------------------------
// 상품등록 입력양식을 브라우져로 출력합니다.
const PrintAddProductForm = (req, res) => {
  let    htmlstream = '';

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_form.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                           'logurl': '/users/logout',
                                           'loglabel': '로그아웃',
                                           'regurl': '/users/profile',
                                           'reglabel': req.session.who }));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품등록기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// 상품등록 양식에서 입력된 상품정보를 신규로 등록(DB에 저장)합니다.
const HanldleAddProduct = (req, res) => {  // 상품등록
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  let    result = { originalName  : picfile.originalname,
                    size : picfile.size     }

       console.log(body);     // 이병문 - 개발과정 확인용(추후삭제).

       if (req.session.auth && req.session.admin) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 DB에 저장할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 등록할 수 없습니다');
          }
          else {
              prodimage = prodimage + picfile.filename;
              regdate = new Date();
              db.query('INSERT INTO u29_product (itemid, category, maker, pname, modelnum, rdate, price, dcrate, amount, event, pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [body.itemid, body.category, body.maker, body.pname, body.modelnum, regdate, body.price, body.dcrate, body.amount, body.event, prodimage], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'상품등록 오류',
                                 'warn_message':'상품으로 등록할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("상품등록에 성공하였으며, DB에 신규상품으로 등록하였습니다.!");
                   res.redirect('/adminprod/list');
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

// 상품정보 변경 양식 리스트를 출력합니다.
const PrintUpdateProductForm = (req, res) => {
  let    htmlstream = '';
       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_alter.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         db.query('SELECT itemid from u29_product', (error, results, fields) => {
          if (error) {
              htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품변경 오류',
                            'warn_message':'상품을 변경할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                            'return_url':'/' }));
           } else {
              console.log("상품변경에 성공하였으며, DB에 상품 정보를 변경하였습니다.!");
              res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                'logurl': '/users/logout',
                                                'loglabel': '로그아웃',
                                                'regurl': '/users/profile',
                                                'reglabel': req.session.who,
                                                 prodata : results
                                               }));
              //res.redirect('/adminprod/list');
           }
      });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품등록기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};
//상품정보 변경 양식에서 저장된 상품 정보를 새로 변경(DB 수정)합니다.
const HanldleUpdateProduct = (req, res) => {  // 상품등록
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  let    result = { originalName  : picfile.originalname,
                    size : picfile.size     }

       console.log(body);

       if (req.session.auth && req.session.admin) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 DB에 변경 할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 변경할 수 없습니다');
          }
          else {
              prodimage = prodimage + picfile.filename;
              regdate = new Date();
              db.query('UPDATE u29_product SET category =?, maker =?, pname =?, modelnum =?, price =?, dcrate =?, amount =?, event =?, pic =? WHERE itemid =?',
                    [body.category, body.maker, body.pname, body.modelnum, body.price, body.dcrate, body.amount, body.event, prodimage, body.itemid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'상품 정보 변경 오류',
                                 'warn_message':'상품 정보를 변경할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("상품 정보 변경 에 성공하였으며, DB에 새로운 정보로 변경하였습니다.!");
                   res.redirect('/adminprod/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품변경기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품변경 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};

//상품 삭제 리스트 양식 출력
const PrintDeleteProductForm = (req, res) => {
let    htmlstream = '';

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_delete.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         db.query('SELECT itemid from u29_product', (error, results, fields) => {
          if (error) {
              htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                           'warn_title':'상품삭제 오류',
                                                           'warn_message':'상품을 삭제할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                                           'return_url':'/' }));
           } else {
              console.log("상품삭제에 성공하였으며, DB에 상품 정보를 삭제하였습니다.!");
              res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                'logurl': '/users/logout',
                                                'loglabel': '로그아웃',
                                                'regurl': '/users/profile',
                                                'reglabel': req.session.who,
                                                 prodata : results
                                               }));
              //res.redirect('/adminprod/list');
           }
      });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품등록기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};
//상품 정보를 삭제합니다.
const HanldleDeleteProduct = (req, res) => {  // 상품정보 삭제
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  //let    result = { originalname  : picfile.originalname,
  //                 size : picfile.size     }

console.log(body.itemid);
       if (req.session.auth && req.session.admin) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 정보를 삭제 할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 삭제할 수 없습니다');
          }
          else {
            console.log(body.itemid);
              db.query('DELETE FROM u29_product WHERE itemid = ?', [body.itemid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'상품삭제 오류',
                                 'warn_message':'상품을 삭제할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("상품삭제에 성공하였으며, DB에 상품 정보를 삭제하였습니다.!");
                   res.redirect('/adminprod/list');
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
//------------------------------------------- 재능등록 화면 출력----------------------------------------
const PrintTalregForm = (req, res) => {
let    htmlstream = '';

       if (req.session.auth && (req.session.useller == 1)) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/talreg.ejs','utf8'); // 괸리자메인화면
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
                             'warn_title':'재능등록기능 오류',
                             'warn_message':'로그인되어 있지 않거나, 튜터로 등록 되어있지 않아서 기능을 사용할 수 없습니다.',
                             'return_url':'/' }))
       }

};
//-------------------------------------------- 재능등록 기능 ---------------------------------------------
const AddTalregForm = (req, res) => {  // 상품등록
  let    body = req.body;
  let    htmlstream = '';
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  let    result = { originalName  : picfile.originalname,
                    size : picfile.size     }

       console.log(body);     // 이병문 - 개발과정 확인용(추후삭제).

       if (req.session.auth) {
           if (body.ttitle == '' || body.tcategory == '' || body.tplace == '' || body.tprice == '') {
             console.log("입력되지 않은 정보가 있어서 등록이 불가능 합니다.");
             res.status(561).end('<meta charset="utf-8">입력되지 않은 정보가 있어서 등록이 불가능 합니다.');
          } else if(body.tcategory == '재능봉사' && body.tprice != '0'){
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                         'warn_title':'재능등록기능 오류',
                                                         'warn_message':'재능봉사는 가격을 입력할 수 없습니다.',
                                                         'return_url':'/' }));
          }
          else {
              prodimage = prodimage + picfile.filename;
              regdate = new Date();
              sql_str = "INSERT INTO talent (uid, ttitle, tcategory, tcomment, texplanation, tplace, tprice, tpic, tdate) values(?,?,?,?,?,?,?,?, now())"
              db.query(sql_str,
                    [req.session.uid, body.ttitle, body.tcategory, body.tcomment, body.texplanation, body.tplace, body.tprice, prodimage], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                                'warn_title':'재능등록 오류',
                                                                'warn_message':'재능을 등록할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                                                'return_url':'/' }));
                } else {
                   console.log("재능등록에 성공하였으며, DB에 신규재능으로 등록하였습니다.!");
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
// -----------------------------------자격증 화면 출력 -------------------------------------
const Printlicense = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/license.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, tcomment, tprice, tplace, tpic from talent WHERE tcategory = '자격증' order by tdate desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                       page : page,
                                                       page_num : 6,
                                                       leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'자격증 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };

// -----------------------------------프로그래밍 화면 출력 -------------------------------------
const PrintProgramming = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/programming.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, tcomment, tprice, tplace, tpic from talent WHERE tcategory = '프로그래밍' order by tdate desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                       page : page,
                                                       page_num : 6,
                                                       leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'자격증 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };
// -----------------------------------외국어 화면 출력 -------------------------------------
const PrintFlanguage = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/flanguage.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, tcomment, tprice, tplace, tpic from talent WHERE tcategory = '외국어' order by tdate desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                       page : page,
                                                       page_num : 6,
                                                       leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'자격증 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };

// -----------------------------------음악 화면 출력 -------------------------------------
const PrintMusic = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/music.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, tcomment, tprice, tplace, tpic from talent WHERE tcategory = '음악' order by tdate desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                       page : page,
                                                       page_num : 6,
                                                       leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'자격증 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };
// -----------------------------------기타 화면 출력 -------------------------------------
const PrintEtc = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/etc.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, tcomment, tprice, tplace, tpic from talent WHERE tcategory = '기타' order by tdate desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                       page : page,
                                                       page_num : 6,
                                                       leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'자격증 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };

// -----------------------------------재능봉사 화면 출력 -------------------------------------
const PrintTalvolunteer = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/talvolunteer.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, tcomment, tprice, tplace, tpic from talent WHERE tcategory = '재능봉사' order by tdate desc;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                       page : page,
                                                       page_num : 6,
                                                       leng : Object.keys(results).length,
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'자격증 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };
//----------------------------------------------재능 정보 상세확인------------------------------------------------------
  const TalDetailForm = (req, res) => {
    let    htmlstream = '';
    let    htmlstream2 = '';
    let    sql_str= '';

    var tnum = req.params.tnum;
    console.log("tnum :" + tnum);

     if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
     htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/talinform.ejs','utf8'); // 괸리자메인화면
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

     sql_str = "SELECT tnum, uid, ttitle, tcategory, tcomment, texplanation, tplace, tprice, tpic, tdate from talent where tnum =? ;";

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
     db.query(sql_str, [tnum], (error, results, fields) => {  // 사용자조회 SQL실행
         if (error) {res.status(562).end("TalDetailForm: DB query is failed"); }
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
                                                  tdata : results
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

//------------------------------상세보기 재능 구매하기 화면 기능-----------------------------------------------
const PrintTalBuy = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

  var tnum = req.params.tnum;
  console.log(" 구매하기 ! tnum : " + tnum);


       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/talbuy.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT tnum, ttitle, uid, tprice from talent where tnum=?;"; // 상품조회SQL
           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, [tnum], (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'상품조회 오류',
                                                                 'warn_message':'조회된 상품이 없습니다.',
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
                                                        tdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'재능 구매 화면 기능 오류',
                                                      'warn_message':'로그인되어 있지 않아서 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }

  };
//----------------------------------------재능 구매하기 기능------------------------------------------
const AddTalbuyForm = (req, res) => {
 let    body = req.body;
 let    htmlstream='';
 let    htmlstream2 = '';
 let    sql_str, sql_str1;

 var tnum = req.params.tnum;
 console.log(tnum);

if (req.session.auth)   {
     if (tnum == '') {
          console.log("재능 번호가 선택 되지 않았습니다.");
          res.status(561).end('<meta charset="utf-8">재능 번호가 선택 되지 않았습니다.');
     }
     else {
       sql_str = 'SELECT ttitle, uid, tprice FROM talent WHERE tnum = ?';
       sql_str1 = 'INSERT INTO deal (dname, dseller, dbuyer, ddate, dprice, dcomplete) VALUES (?, ?, ?, now(), ?, "거래중");'
        db.query(sql_str, [tnum], (error, tdata, fields) => {
           if (error) {
             console.log(error);
           } else {
             db.query(sql_str1, [tdata[0].ttitle, tdata[0].uid, req.session.uid, tdata[0].tprice], (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("Printlicense: DB query is failed"); }
               else { // 조회된 상품이 있다면, 상품리스트를 출력

                                                            res.redirect('/');
                                                          }
               });
             }

        });
     }
   }
 };

//  -----------------------------------  사용자리스트 기능 -----------------------------------------
// (관리자용) 등록된 사용자 리스트를 브라우져로 출력합니다.
const AdminPrintUser = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    uid = req.params.uid;
  let    page = req.params.page;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminuser.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT uid, uname, upnum, ubirth, useller, uaccount from users where uid != 'admin' order by uname desc;"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("AdminPrintUser: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'사용자 조회 오류',
                                                                 'warn_message':'조회된 사용자가 없습니다.',
                                                                 'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '청개천_관리자',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        page : page,
                                                        page_num : 10,
                                                        leng : Object.keys(results).length,
                                                        userdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'사용자 리스트 기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//  -----------------------------------  사용자리스트 삭제 기능 -----------------------------------------
// (관리자용) 등록된 사용자 리스트 삭제 기능를 브라우져로 출력합니다.
const AdminDeleteUser = (req,res) => {
let    sql_str1;
let    body = req.body;
let    page = req.params.page;

sql_str1 = "DELETE from users WHERE uid = ?";

    //console.log(typeof(body.usernum));
    if(typeof(body.uid) == "string"){
      db.query(sql_str1, [body.uid], (error, results, fields) => {  // 상품조회 SQL실행
          if (error) {
              console.log(error);
              htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                            'warn_title':'회원 삭제 오류',
                                                            'warn_message':'선택 된 회원이 없습니다.',
                                                            'return_url':'/' }));
          }else{
            res.redirect('/adminprod/usermanage/1');
          }
      }); // db.query()
    }else{
      async.waterfall([ // 여러명의 회원을 삭제할 경우에는 비동기식을 동기식으로 바꿔준다.
        function(callback){
          for(var i=0; i<body.uid.length; i++){
            db.query(sql_str1, [body.uid[i]], (error, results, fields) => {  // 상품조회 SQL실행
                if (error) {
                    console.log(error);
                    htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                    res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                  'warn_title':'회원 삭제 오류',
                                                                  'warn_message':'선택 된 회원이 없습니다.',
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
      res.redirect('/adminprod/usermanage/1');
    }
};
//  -----------------------------------  재능리스트 기능 -----------------------------------------
// (관리자용) 등록된 재능 리스트를 브라우져로 출력합니다.
const AdminPrintTalent = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    tnum = req.params.tnum;
  let    page = req.params.page;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/admintalent.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT tnum, uid, ttitle, tcategory, tplace, tprice, tdate from talent order by tdate desc;"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("AdminPrintTalent: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'재능조회 오류',
                                                                 'warn_message':'조회된 재능이 없습니다.',
                                                                 'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '청개천_관리자',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        page : page,
                                                        page_num : 10,
                                                        leng : Object.keys(results).length,
                                                        taldata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'재능 리스트 기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//  -----------------------------------  재능리스트 삭제 기능 -----------------------------------------
// (관리자용) 등록된 재능 리스트 삭제 기능를 브라우져로 출력합니다.
const AdminDeleteTalent = (req,res) => {
let    sql_str1;
let    body = req.body;
let    page = req.params.page;

sql_str1 = "DELETE from talent WHERE tnum = ?";

    //console.log(typeof(body.usernum));
    if(typeof(body.tnum) == "string"){
      db.query(sql_str1, [body.tnum], (error, results, fields) => {  // 상품조회 SQL실행
          if (error) {
              console.log(error);
              htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                            'warn_title':'재능 삭제 오류',
                                                            'warn_message':'선택 된 재능이 없습니다.',
                                                            'return_url':'/' }));
          }else{
            res.redirect('/adminprod/talentmanage/1');
          }
      }); // db.query()
    }else{
      async.waterfall([ // 여러명의 회원을 삭제할 경우에는 비동기식을 동기식으로 바꿔준다.
        function(callback){
          for(var i=0; i<body.tnum.length; i++){
            db.query(sql_str1, [body.tnum[i]], (error, results, fields) => {  // 상품조회 SQL실행
                if (error) {
                    console.log(error);
                    htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                    res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                  'warn_title':'재능 삭제 오류',
                                                                  'warn_message':'(중복)선택 된 재능이 없습니다.',
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
      res.redirect('/adminprod/talentmanage/1');
    }
};
//  -----------------------------------  거래 내역리스트 기능 -----------------------------------------
// (관리자용) 등록된 거래 내역 리스트를 브라우져로 출력합니다.
const AdminPrintBuylist = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    dnum = req.params.dnum;
  let    page = req.params.page;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbuylist.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT dnum, dname, dseller, dbuyer, ddate, dprice, dcomplete from deal order by ddate desc;"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("AdminPrintBuylist : DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'거래내역 조회 오류',
                                                                 'warn_message':'조회된 거래가 없습니다.',
                                                                 'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '청개천_관리자',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        page : page,
                                                        page_num : 10,
                                                        leng : Object.keys(results).length,
                                                        dealdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'거래내역 기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//  ----------------------------------- 게시판 내역리스트 기능 -----------------------------------------
// (관리자용) 등록된 게시판 내역 리스트를 브라우져로 출력합니다.
const AdminPrintBoard = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  var    inum = req.params.inum;
  let    page = req.params.page;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminboard.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT inum, uid, itype, ititle, idate, icomplete from inquiry order by idate desc;"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("AdminPrintBoard : DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                 'warn_title':'게시판 내역 조회 오류',
                                                                 'warn_message':'조회된 게시판 내역이 없습니다.',
                                                                 'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '청개천_관리자',
                                                       'talregurl': '/adminprod/talreg',
                                                       'talreglabel' : '재능등록',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        page : page,
                                                        page_num : 10,
                                                        leng : Object.keys(results).length,
                                                        idata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'게시판 내역 기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};
//  -----------------------------------  게시판 리스트 삭제 기능 -----------------------------------------
// (관리자용) 등록된 게시판 리스트 삭제 기능를 브라우져로 출력합니다.
const AdminDeleteBoard = (req,res) => {
let    sql_str1;
let    body = req.body;
let    page = req.params.page;

sql_str1 = "DELETE from inquiry WHERE inum = ?";


    //console.log(typeof(body.usernum));
    if(typeof(body.inum) == "string"){
      db.query(sql_str1, [body.inum], (error, results, fields) => {  // 상품조회 SQL실행
          if (error) {
              console.log(error);
              htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                            'warn_title':'게시글 삭제 오류',
                                                            'warn_message':'선택 된 게시글이 없습니다.',
                                                            'return_url':'/' }));
          }else{
            res.redirect('/adminprod/boardmanage/1');
          }
      }); // db.query()
    }else{
      async.waterfall([ // 여러명의 회원을 삭제할 경우에는 비동기식을 동기식으로 바꿔준다.
        function(callback){
          for(var i=0; i<body.inum.length; i++){
            db.query(sql_str1, [body.inum[i]], (error, results, fields) => {  // 상품조회 SQL실행
                if (error) {
                    console.log(error);
                    htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                    res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                                  'warn_title':'게시글 삭제 오류',
                                                                  'warn_message':'(중복)선택 된 게시글이 없습니다.',
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
      res.redirect('/adminprod/boardmanage/1');
    }
};
//  ----------------------------------- 게시판 답변 화면 -----------------------------------------
// (관리자용) 등록된 게시판 내역 답변하기 화면을 브라우져로 출력합니다.
const AdminPrintReply = (req, res) => {
let    htmlstream = '';
let    htmlstream2 = '';
let    sql_str= '';
let    page = req.params.page;
var    inum = req.params.inum;

     if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
     htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/boardreply.ejs','utf8'); // 괸리자메인화면
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

     sql_str = "SELECT inum, iquestion, ireply from inquiry where inum =? ;";

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
     db.query(sql_str, [inum], (error, results, fields) => {  // 사용자조회 SQL실행
         if (error) {res.status(562).end("AdminPrintReply : DB query is failed"); }
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
                                                  'warn_title':'게시판 답변 기능 오류',
                                                  'warn_message':'관리자로 로그인되어 있지 않아서, 답변 기능을 사용할 수 없습니다.',
                                                  'return_url':'/' }));
   }
  };

//----------------------게시판 답변 기능
const AdminBoardReply = (req, res) => {  // 사용자 정보 변경
let    body = req.body;
let    htmlstream = '';
var    inum = req.params.inum;
let    page = req.params.page;

  if (req.session.auth && req.session.admin) {
      db.query('UPDATE inquiry SET ireply =?, icomplete = "답변완료" WHERE inum =?' , [body.ireply, inum], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                                'warn_title':'게시판 답변 오류',
                                                                'warn_message':'게시판 답변시 오류가 발생하였습니다.',
                                                                'return_url':'/' }));
                } else {
                  htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                  res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                               'warn_title':'게시판 답변',
                                                               'warn_message':'게시글에 답변 작성이 완료되었습니다.',
                                                               'return_url':'/'
                                                               }));
                }
           });
         }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                         'warn_title':'오류',
                                                         'warn_message':'관리자로 로그인이 되어있지 않습니다.',
                                                         'return_url':'/' }));
         }
  };
// REST API의 URI와 핸들러를 매핑합니다.
router.get('/talreg', PrintTalregForm); // 재능등록화면을 출력처리
router.post('/talreg', upload.single('tpic'), AddTalregForm);  // 재능등록기능을 처리
router.get('/license/:page', Printlicense); // 자격증 재능 화면 출력 처리
router.get('/programming/:page', PrintProgramming); // 프로그래밍 재능 화면 출력 처리
router.get('/flanguage/:page', PrintFlanguage); // 외국어 재능 화면 출력 처리
router.get('/music/:page', PrintMusic); // 음악 재능 화면 출력 처리
router.get('/etc/:page', PrintEtc); // 기타 재능 화면 출력 처리
router.get('/talvolunteer/:page', PrintTalvolunteer); // 재능봉사 화면 출력 처리
router.get('/read/:tnum', TalDetailForm); //게시글 상세보기 페이지 화면
router.get('/talbuy/:tnum', PrintTalBuy); // 재능 구매하기 페이지 화면
router.post('/talpay/:tnum', AddTalbuyForm); // 재능 구매하기 기능

router.get('/usermanage/:page', AdminPrintUser); // (관리자)사용자 리스트 화면 출력 처리
router.delete('/userdelete', AdminDeleteUser); // (관리자) 사용자 리스트 삭제 기능
router.get('/talentmanage/:page', AdminPrintTalent); // (관리자)재능 리스트 화면 출력 처리
router.delete('/talentdelete', AdminDeleteTalent); //(관리자) 재능 리스트 삭제 기능
router.get('/buylistmanage/:page', AdminPrintBuylist); // (관리자) 거래 내역 리스트 화면 출력 처리
router.get('/boardmanage/:page', AdminPrintBoard); // (관리자) 게시판 리스트 화면 출력 처리
router.delete('/boarddelete', AdminDeleteBoard); //(관리자) 게시판 리스트 삭제 기능
router.get('/reply/:inum', AdminPrintReply); // (관리자) 게시판 답변하기 화면 출력 처리
router.put('/reply/:inum', AdminBoardReply); // (관리자) 게시판 답변 기능


// router.get('/form', PrintAddProductForm);   // 상품등록화면을 출력처리
// router.post('/product', upload.single('photo'), HanldleAddProduct);    // 상품등록내용을 DB에 저장처리
// router.get('/list', AdminPrintProd); // 상품리스트를 화면에 출력
// router.get('/prodalter', PrintUpdateProductForm);
// router.put('/alter', upload.single('photo'), HanldleUpdateProduct);      // 상품 정보를 변경
// router.get('/proddelete', PrintDeleteProductForm);
// router.delete('/delete', HanldleDeleteProduct);     // 상품 정보를 삭제

module.exports = router;
