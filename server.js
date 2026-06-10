//익스프레스 사용하겠다
const express = require('express');
const app = express();

//퍼블릭 가져다가 쓰는거
app.use(express.static(__dirname + '/public'));

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
  응답.send('오늘 맑음');
});

app.get('/shop', (요청, 응답) => {
  응답.send('쇼핑 페이지임');
});
