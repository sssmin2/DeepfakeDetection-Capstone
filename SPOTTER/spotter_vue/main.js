import { createApp } from 'vue'
import App from './App.vue'
import router from './router'; // 라우터 불러오기
import './assets/global.css'; //  전역 스타일 불러오기

createApp(App).use(router).mount('#app')  // 라우터 연결
