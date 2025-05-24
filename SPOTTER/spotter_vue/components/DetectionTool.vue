<template>
  <div class="detection-wrapper">
    <!-- 드래그 앤 드롭 영역 -->
    <div
      class="drop-zone"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
      :class="{ dragover: isDragging }"
      @click="triggerInput"
    >
      <input type="file" ref="fileInput" hidden @change="onFileChange" />
      <p v-if="!imageUrl && !videoUrl">이미지 또는 영상 업로드</p>
      <img v-if="imageUrl" :src="imageUrl" alt="업로드 이미지" class="preview-img" />
      <video v-if="videoUrl" :src="videoUrl" controls class="preview-video" />
    </div>

    <!-- 분석 결과 -->
    <div v-if="result" class="result-box">
      <p class="result-text">탐지 결과: {{ result }}</p>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <img :src="loadingGif" alt="로딩 중..." />
        <p>분석 중입니다...</p>
      </div>
    </div>
  </div>
</template>


<script>
import loadingGif from '@/assets/loading.gif';

export default {
  name: "DetectionTool",
  data() {
    return {
      isDragging: false,
      imageUrl: null,
      videoUrl: null,
      result: "",
      prob: "",
      isLoading: false,   // 로딩 중인지 여부
      loadingGif: loadingGif
    };
  },
  mounted() {
    const query = this.$route.query;
    if (query.image && query.result && query.prob) {
      this.imageUrl = decodeURIComponent(query.image);
      this.result = query.result;
      this.prob = query.prob;
    } else if (query.result && query.prob) {
      this.result = query.result;
      this.prob = query.prob;
    }
  },
  methods: {
    onDragOver() {
      this.isDragging = true;
    },
    onDragLeave() {
      this.isDragging = false;
    },
    onDrop(event) {
      this.isDragging = false;
      const files = event.dataTransfer.files;
      this.handleFiles(files);
    },
    onFileChange(event) {
      this.handleFiles(event.target.files);
    },
    triggerInput() {
      this.$refs.fileInput.click();
    },
    async handleFiles(files) {
      const file = files[0];
      if (!file) return;

      // 초기화
      this.imageUrl = null;
      this.videoUrl = null;
      this.result = "";
      this.prob = "";
      this.isLoading = true;

      const formData = new FormData();
      formData.append("file", file);

      // 미리보기 설정
      if (file.type.startsWith("image/")) {
        this.imageUrl = URL.createObjectURL(file);
      } else if (file.type.startsWith("video/")) {
        this.videoUrl = URL.createObjectURL(file);
      } else {
        alert("지원하지 않는 파일 형식입니다.");
        this.isLoading = false; // 지원하지 않는 경우에 로딩 중지
        return;
      }

      try {
        const response = await fetch("/spotter/predicted", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error("서버 응답 오류");
        }

        const data = await response.json();
        this.result = data.result;
        this.prob = data.probability;
      } catch (err) {
        console.error("서버 에러:", err);
        this.result = "서버 오류가 발생했습니다.";
        this.prob = "";
      } finally {
        this.isLoading = false; // 로딩 끝
      }
    }
  }
};
</script>

<style scoped>
.detection-wrapper {
  /* display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px; */
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 120px; /* 위쪽 여백만 늘리기 */
}

.drop-zone {
  width: 300px;
  height: 300px;
  background-color: #f8f8f8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-weight: bold;
  color: #3b82f6;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}

.drop-zone.dragover {
  background-color: #e6efff;
  border: 2px dashed #3b82f6;
}

.preview-img,
.preview-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.result-box {
  padding: 20px;
  background: #f0f4ff;
  border: 1px solid #c9ddff;
  border-radius: 8px;
  text-align: center;
  width: 300px;
}

.result-text {
  font-weight: bold;
  color: #3b82f6;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  font-weight: bold;
  color: #3b82f6;
  font-size: 18px;
}

.loading-content img {
  width: 400px;
  height: 400px;
}
</style>
