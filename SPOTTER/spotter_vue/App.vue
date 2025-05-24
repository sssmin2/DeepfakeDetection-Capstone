<template>
  <div class="app-wrapper">
    <!-- 상단 헤더: 로고 + 네비게이션 버튼 -->
    <header class="header">
      <router-link to="/" class="logo-link">
        <img class="logo-img" src="@/assets/logo.png" alt="Spotter 로고" />
      </router-link>
      <nav class="nav-buttons">
        <router-link to="/detection" class="nav-btn" exact-active-class="active">Detection</router-link>
        <!-- <router-link to="/watermark" class="nav-btn" exact-active-class="active">Watermark</router-link>
        <router-link to="/extension" class="nav-btn" exact-active-class="active">Extension</router-link> -->
      </nav>
    </header>

    <!-- 라우터 뷰: 페이지 내용이 이 자리에 바뀌면서 표시됨 -->
    <main class="main-container">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App"
};
</script>

<style scoped>

/* 전체 페이지 레이아웃 */
.app-wrapper {
  font-family: 'Segoe UI', sans-serif;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 헤더 스타일 */
.header {
  display: flex;
  align-items: center;
  background-color: #5f9efb;
  padding: 2vh 1vw 2vh 0.5vw; /* 반응형 여백 */
  height: 70px; /* 전체 화면의 20% 차지 */
  box-sizing: border-box;
}

/* 로고 이미지 */
.logo-img {
  height: 60px; /* 화면 크기에 따라 비율 조절 */
  filter: brightness(0) invert(1); /* 어두운 로고를 흰색처럼 보여줌 */
  transition: filter 0.3s ease, opacity 0.3s ease; /* 부드러운 전환 */
}

.logo-img:hover {
  filter: brightness(0.8) invert(1); /* 살짝 어둡게 */
  opacity: 0.8; /* 살짝 흐려지게 */
}

/* 네비게이션 버튼 컨테이너 */
.nav-buttons {
  display: flex;
  gap: 1vw;
}

/* 버튼 스타일 */
.nav-btn {
  color: #f9f9f9;
  padding: 0.8vh 1.6vw;
  border-radius: 20px;
  text-decoration: none;
  font-weight: bold;
  transition: 0.2s;
  font-size: 1rem;
}

/* 마우스 호버 시 */
.nav-btn:hover {
  background-color: #e0ecff3e;
}

/* 현재 활성화된 버튼 */
.nav-btn.active {
  background-color: #3b82f6;
  color: white;
}

/* 본문 콘텐츠 영역 */
.main-container {
  flex: 1;
  padding: 5vh 5vw;
  background: #f9f9f9;
  box-sizing: border-box;
  border-radius: 12px;
}
</style>
