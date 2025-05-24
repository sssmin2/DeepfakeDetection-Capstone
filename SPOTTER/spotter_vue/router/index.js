// Vue Router에서 필요한 함수 불러오기
import { createRouter, createWebHistory } from 'vue-router';

// 각 페이지(컴포넌트)를 가져오기
import Home from '@/components/HomePage.vue';
import Detection from '@/components/DetectionTool.vue';

// 라우트 정의: 각 경로(path)에 어떤 컴포넌트를 보여줄지 설정
const routes = [
    {
      path: '/',              // 웹사이트 접속 시 기본 경로 (루트)
      name: 'HomePage',
      component: Home         // Home.vue 컴포넌트를 보여줌
    },
    {
      path: '/detection',     // /detection 경로일 때
      name: 'DetectionTool',
      component: Detection    // Detection.vue 컴포넌트를 보여줌
    }
  ];

// 라우터 생성: 웹 히스토리 모드 사용 (URL이 # 없이 깔끔함)
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 라우터를 외부에서 사용할 수 있게 export
export default router;
