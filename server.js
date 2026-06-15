//익스프레스 사용하겠다
require('dotenv').config();
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

//passport라이브러리 셋팅
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const MongoStore = require('connect-mongo').default;

app.use(passport.initialize());
app.use(
  session({
    secret: '암호화에 쓸 비번',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: new MongoStore({
      mongoUrl: process.env.MONGO_URL,
      dbName: 'forum',
    }),
  }),
);

app.use(passport.session());

//퍼블릭 가져다가 쓰는거
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(methodOverride('_method'));

app.use(express.json());
//// form 태그로 보낸 데이터 받기
app.use(express.urlencoded({ extended: true }));

//서버 띄우는 코드  listen(8080, 이건 포트 번호
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}에서 서버 실행중`);
});

function checkLogin(요청, 응답, next) {
  if (!요청.user) {
    return 응답.send('로그인하세요');
  }
  next();
}

function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;
  return `${period} ${displayHours}시 ${minutes}분`;
}

//공개 라우트 (로그인 필요 없음)
app.get('/about', (요청, 응답) => {
  응답.sendFile(__dirname + '/about.html');
});

app.get('/time', (요청, 응답) => {
  const formattedTime = formatTime(new Date());
  응답.render('time.ejs', { time: formattedTime });
});

app.get('/login', async (요청, 응답) => {
  console.log(요청.user);
  응답.render('login.ejs');
});

app.get('/register', (요청, 응답) => {
  응답.render('register.ejs');
});

//로그인 필요한 라우트
app.get('/', (요청, 응답) => {
  응답.sendFile(__dirname + '/index.html');
});

app.get('/write', (요청, 응답) => {
  응답.render('write.ejs');
});

app.get('/news', (요청, 응답) => {
  db.collection('post').insertOne({ title: '오늘의 날씨', content: '맑음' });
});

app.get('/shop', (요청, 응답) => {
  응답.send('쇼핑 페이지임');
});

app.get('/list', async (요청, 응답) => {
  if (!db) {
    return 응답.send('DB 연결 실패. 잠시 후 다시 시도해주세요.');
  }
  let result = await db.collection('post').find().toArray();
  console.log(result[0].title);
  응답.render('list.ejs', { posts: result });
});

app.post('/add', async (요청, 응답) => {
  try {
    console.log(요청.body);

    const { title, content } = 요청.body;

    //최소한의 검즘
    if (!title || !content) {
      return 응답.status(400).json({
        success: false,
        message: '제목과 내용을 입력해 주세요',
      });
    }

    const savedPost = await db.collection('post').insertOne({
      title,
      content,
    });
    return 응답.redirect('/list');
  } catch (error) {
    console.error(error);

    return 응답.status(500).json({
      success: false,
      message: '서버 오류로 글 저장에 실패했습니다.',
    });
  }
});

// 어느 디비건 똑같은 디비 연결 코드 복붙 데이터 입출력 하는 문법으로 입출력
const { MongoClient, ObjectId } = require('mongodb');

let db;
const url = process.env.MONGO_URL;

new MongoClient(url)
  .connect()
  .then((client) => {
    console.log('DB 연결 성공');
    db = client.db('forum');
  })
  .catch((error) => {
    console.log('DB 연결 실패:', error.message);
  });

app.get('/detail/:id', async (요청, 응답) => {
  try {
    let result = await db.collection('post').findOne({
      _id: new ObjectId(요청.params.id),
    });
    console.log(result);
    if (result == null) {
      return 응답.status(400).send('이상한 url 입력함');
    }
    응답.render('detail.ejs', { post: result });
  } catch (e) {
    console.log(e);
    응답.status(400).send('이상한 url 입력함');
  }
});

app.get('/edit/:id', async (요청, 응답) => {
  try {
    let result = await db.collection('post').findOne({
      _id: new ObjectId(요청.params.id),
    });
    if (result == null) {
      return 응답.status(400).send('이상한 url 입력함');
    }
    응답.render('edit.ejs', { post: result });
  } catch (e) {
    console.log(e);
    응답.status(400).send('이상한 url 입력함');
  }
});

app.put('/edit/:id', async (요청, 응답) => {
  try {
    const { title, content } = 요청.body;

    if (!title || !content) {
      return 응답.status(400).json({
        success: false,
        message: '제목과 내용을 입력해 주세요',
      });
    }

    await db
      .collection('post')
      .updateOne(
        { _id: new ObjectId(요청.params.id) },
        { $set: { title, content } },
      );
    응답.redirect('/list');
  } catch (error) {
    console.error(error);
    응답.status(500).json({
      success: false,
      message: '서버 오류로 글 수정에 실패했습니다.',
    });
  }
});

app.post('/abc/:id', async (요청, 응답) => {
  try {
    const { id } = 요청.params;
    console.log('받은 id:', id, '타입:', typeof id);
    await db.collection('post').deleteOne({
      _id: new ObjectId(id),
    });

    응답.json({ success: true, message: '삭제 완료' });
  } catch (error) {
    console.error(error);
    응답.status(500).json({
      success: false,
      message: '삭제 실패',
    });
  }
});

app.get('/list/:id', async (요청, 응답) => {
  let result = await db
    .collection('post')
    .find()
    .skip((요청.params.id - 1) * 5)
    .limit(5)
    .toArray();
  console.log(result[0].title);
  응답.render('list.ejs', { posts: result });
});

app.get('/login', async (요청, 응답) => {
  console.log(요청.user);
  응답.render('login.ejs');
});

passport.use(
  new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db
      .collection('user')
      .findOne({ username: 입력한아이디 });
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' });
    }

    if (await bcrypt.compare(입력한비번, result.password)) {
      return cb(null, result);
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }),
);

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({
    _id: new ObjectId(user.id),
  });
  delete result.password;
  process.nextTick(() => {
    return done(null, user);
  });
});

app.post('/login', (요청, 응답, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) {
      return 응답.status(500).json(error);
    }
    if (!user) {
      return 응답.status(401).json(info.message);
    }
    요청.login(user, (err) => {
      if (err) return next(err);
      응답.redirect('/');
    });
  })(요청, 응답, next);
});

//로그인 확인 미들웨어
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/mypage', isLoggedIn, (req, res) => {
  res.render('mypage.ejs', { user: req.user });
});

app.get('/register', (요청, 응답) => {
  응답.render('register.ejs');
});

app.post('/register', async (요청, 응답) => {
  let hash = await bcrypt.hash(요청.body.password, 10);
  console.log(hash);

  await db.collection('user').insertOne({
    username: 요청.body.username,
    password: hash,
  });
  응답.redirect('/');
});
