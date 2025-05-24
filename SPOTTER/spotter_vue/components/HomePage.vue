<template>
  <div class="home-wrapper">
    <div class="content-container">
      <!-- 왼쪽 이미지 -->
      
      <!-- 오른쪽 드래그 앤 드롭 영역 -->
      <div
        class="drop-zone"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
        :class="{ dragover: isDragging }"
        @click="triggerInput"
      >
        <input type="file" ref="fileInput" hidden @change="onFileChange" />
        <p>이미지 업로드</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  data() {
    return {
      isDragging: false
    };
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

  const formData = new FormData();
  formData.append("file", file);

  const isImage = file.type.startsWith("image/");

  if (isImage) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;

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

        this.$router.push({
          path: "/detection",
          query: {
            image: encodeURIComponent(base64Image),
            result: data.result,
            prob: data.probability
          }
        });
      } catch (err) {
        console.error("서버 오류:", err);
        alert("서버 오류가 발생했습니다.");
      }
    };

    reader.readAsDataURL(file);
  } else if (file.type.startsWith("video/")) {
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

      this.$router.push({
        path: "/detection",
        query: {
          result: data.result,
          prob: data.probability
        }
      });
    } catch (err) {
      console.error("서버 오류:", err);
      alert("영상 분석 중 오류가 발생했습니다.");
    }
  } else {
    alert("지원하지 않는 파일 형식입니다.");
  }
    }
  }
};
</script>

<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.content-container {
  display: flex;
  gap: 40px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.left-image img {
  width: 220px;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drop-zone {
  width: 260px;
  height: 260px;
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
}

.drop-zone.dragover {
  background-color: #e6efff;
  border: 2px dashed #3b82f6;
}
</style>
