//익스프레스 사용하겠다
require('dotenv').config();
const express = require('express');
const app = express();
const methodOverride = require('method-override');

//퍼블릭 가져다가 쓰는거
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(methodOverride('_method'));

app.use(express.json());
//// form 태그로 보낸 데이터 받기
app.use(express.urlencoded({ extended: true }));

//서버 띄우는 코드  listen(8080, 이건 포트 번호
app.listen(8080, () => {
  console.log('http://localhost:8080에서 서버 실행중');
});

//메인 페이지 가면 반갑다 반환
app.get('/', (요청, 응답) => {
  응답.sendFile(__dirname + '/index.html');
});

app.get('/about', (요청, 응답) => {
  응답.sendFile(__dirname + '/about.html');
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

app.get('/time', (요청, 응답) => {
  응답.render('time.ejs', { time: new Date() });
});

app.get('/list', async (요청, 응답) => {
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
    console.log(error);
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
