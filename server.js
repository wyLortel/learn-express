//익스프레스 사용하겠다
require('dotenv').config();
const express = require('express');
const app = express();

//퍼블릭 가져다가 쓰는거
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

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

// 어느 디비건 똑같은 디비 연결 코드 복붙 데이터 입출력 하는 문법으로 입출력
const { MongoClient } = require('mongodb');

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
