// Spotter 통합 content.js (누락 없이 완전 구성 + 디버깅용 로그 포함)

console.log("[Spotter] content.js 로드됨");

let isAnalyzing = false;
let analyzeTimer = null;
let lastVideoId = null;
let isStopped = false;
let previousPath = location.pathname;

// 메시지 리스너
chrome.runtime.onMessage.addListener((message) => {
  console.log("[Spotter] 받은 메시지:", message);

  if (message.action === "toggleFloating") {
    const existing = document.getElementById("spotter-floating");
    if (existing) {
      console.log("플로팅 패널 제거됨");
      existing.remove();
    } else {
      console.log("플로팅 패널 생성 요청");
      createFloatingPanel();
    }
  }

  if (message.action === "startAnalysis" || message.action === "startAnalysisFromFloating") {
    console.log("[Spotter] startAnalysis 메시지 수신");
    isStopped = false;
    lastVideoId = null;
    autoAnalysisEnabled = true; // 여기서 활성화
    analyzeShortsVideo();
  }

  if (message.action === "stopAnalysis" || message.action === "stopAnalysisFromFloating") {
    console.log("[Spotter] stopAnalysis 수신 → 분석 중지");
    isStopped = true;
    clearInterval(analyzeTimer);
    analyzeTimer = null;
    isAnalyzing = false;
  }
});

// 🔹 유틸 함수
function isYouTubeShorts() {
  const result = location.hostname.includes("youtube.com") && location.pathname.startsWith("/shorts/");
  console.log(`isYouTubeShorts(): ${result}`);
  return result;
}

function extractVideoIdFromUrl() {
  const id = location.pathname.split("/")[2];
  console.log("현재 video ID:", id);
  return id;
}

function getCurrentVideo() {
  const videos = document.querySelectorAll("video");
  for (const v of videos) {
    if (!v.paused && !v.ended && v.readyState >= 2 && v.duration > 1) {
      console.log("재생 중인 영상 감지됨:", v);
      return v;
    }
  }
  console.warn("재생 중인 video 요소를 찾지 못함");
  return null;
}

function triggerYouTubeReportUI() {
  console.log("[Spotter] 유튜브 신고 UI 띄우기 시도");

  const moreButton = document.querySelector('button[aria-label*="더보기"]');
  if (!moreButton) {
    console.error("[Spotter] '더보기' 버튼을 찾을 수 없음");
    return;
  }

  moreButton.click();
  console.log("[Spotter] '더보기' 버튼 클릭 완료");

  const tryClickReport = () => {
    const reportButton = Array.from(document.querySelectorAll('yt-formatted-string'))
      .find(el => el.innerText.trim() === "신고");

    if (reportButton) {
      reportButton.click();
      console.log("[Spotter] '신고' 버튼 클릭 완료");
    } else {
      console.warn("[Spotter] '신고' 버튼 대기 중...");
      setTimeout(tryClickReport, 300);
    }
  };

  setTimeout(tryClickReport, 500); // 메뉴 뜨기 약간 기다림
}

//블러처리
function applyBlurOverlay(videoElement, reasonText = "이 영상은 딥페이크로 의심됩니다.") {
  if (document.getElementById("spotter-blur-overlay")) return;
  console.log("블러 오버레이 적용됨");

  const rect = videoElement.getBoundingClientRect();

  const overlay = document.createElement("div");
  overlay.id = "spotter-blur-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    backdrop-filter: blur(30px);
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    pointer-events: none;
  `;

  overlay.innerHTML = `
    <div style="pointer-events: auto; text-align: center;">
      <h2>⚠️ 민감한 콘텐츠</h2>
      <p>${reasonText}</p>
      <div style="margin-top: 12px;">
        <button id="show-video-btn" style="padding:8px 16px;margin-right:10px;">그래도 보기</button>
        <button id="report-video-btn" style="padding:8px 16px;background-color:#ff4d4d;color:#fff;">🚨 신고하기</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#show-video-btn").onclick = () => overlay.remove();
  overlay.querySelector("#report-video-btn").onclick = () => {
    overlay.remove();
    setTimeout(() => {
      triggerYouTubeReportUI();
    }, 100);
  };
}

function sendVideoUrlToServer(url) {
  console.log("서버 전송 시작:", url);
  fetch("http://localhost:8080/spotter/shorts_video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  })
    .then(res => res.json())
    .then(data => {
      console.log("분석 결과 수신:", data);

      // 여기에서 바로 리스트 업데이트
      updateFloatingListWithUrl(url);

    const reportEl = document.getElementById("report-content"); // 선언 추가
    if (reportEl) {
      reportEl.innerHTML = `
        <h3>📊 분석 리포트</h3>
        <p style="font-size : 15px;"><strong>결과:</strong> ${data.result}</p>
        <p><strong>확률:</strong> ${data.probability}</p>
      `;


      // 분석 완료 시 리포트 탭 자동 전환
      // 분석 완료 시 탭 전환 요청
      window.postMessage({ type: "SPOTTER_OPEN_TAB", tabId: "result-tab" }, "*");
    }
    

      if (data.result === "딥페이크") {
        const video = getCurrentVideo();
        if (video) applyBlurOverlay(video, "이 영상은 딥페이크로 분류되었습니다.");
      }
    })
    .catch(err => console.error("서버 오류:", err));
}

function updateFloatingListWithUrl(url) {
  const container = document.getElementById("recent-list");
  if (!container) return;

  // 기존 항목 중복 제거 + 최대 3개 유지
  const items = Array.from(container.querySelectorAll("a")).map(a => a.href);
  const newItems = [url, ...items.filter(item => item !== url)].slice(0, 3);

  // 링크로 렌더링
  container.replaceChildren(...newItems.map(linkUrl => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = linkUrl;
    link.textContent = linkUrl;
    link.target = "_blank";
    link.style.color = "black";
    li.appendChild(link);
    return li;
  }));
}

function waitAndAnalyzeIfWatchedEnough(minSeconds = 4, onSuccess) {
  let video = getCurrentVideo();
  if (!video) {
    console.warn("video가 없음. 1초 뒤 재시도");
    setTimeout(() => waitAndAnalyzeIfWatchedEnough(minSeconds, onSuccess), 1000);
    return;
  }

  let watchedTime = 0;
  let lastTime = video.currentTime;
  let stuckCount = 0;
  let forceTriggered = false;
  let autoAnalysisEnabled = false;

  clearInterval(analyzeTimer);
  analyzeTimer = setInterval(() => {
    const currentTime = video.currentTime;

    if (!video.paused && currentTime > lastTime) {
      watchedTime += currentTime - lastTime;
      stuckCount = 0;
    } else if (!video.paused && currentTime === lastTime) {
      stuckCount++;
    }

    lastTime = currentTime;
    console.log(`⏱ 시청 시간 누적: ${watchedTime.toFixed(2)}s, 정지감지: ${stuckCount}`);

    if (!forceTriggered && stuckCount >= 2) {
      forceTriggered = true;
      clearInterval(analyzeTimer);
      console.log("시청 시간 고정 → 강제 분석 진행");
      onSuccess();
    }

    if (watchedTime >= minSeconds) {
      clearInterval(analyzeTimer);
      console.log("시청 시간 조건 충족 → 분석 시작");
      onSuccess();
    }
  }, 1000);
}

function analyzeShortsVideo(force = false) {
  if (isStopped) {
    console.log("분석 중지 상태 → 실행 안함");
    return;
  }
  if (!isYouTubeShorts()) {
    console.log("숏츠 아님 → 분석 제외");
    return;
  }

  const currentId = extractVideoIdFromUrl();
  if (!force && (isAnalyzing || currentId === lastVideoId)) {
    console.log("⏸ 중복 분석 방지 → 실행 생략", { isAnalyzing, currentId, lastVideoId });
    return;
  }
  //isAnalyzing = true;
  lastVideoId = currentId;

  const reportEl = document.getElementById("report-content");
  if (reportEl) reportEl.innerHTML = "";

  waitAndAnalyzeIfWatchedEnough(4, () => {
    console.log("서버 분석 트리거 시작됨");
    isAnalyzing = true;
    sendVideoUrlToServer(location.href);
    isAnalyzing = false;
  });
}

setInterval(() => {
  if (!autoAnalysisEnabled) return; // 분석 활성화된 상태에서만 실행

  if (isYouTubeShorts() && location.pathname !== previousPath) {
    console.log("경로 변경 감지 → 분석 재시작");
    previousPath = location.pathname;
    lastVideoId = null;
    analyzeShortsVideo();
  }
}, 1000);

const style = document.createElement('style');
style.textContent = `#spotter-blur-overlay button:hover { opacity: 0.9; }`;
document.head.appendChild(style);

// ----------------------
//   플로팅 패널 생성
// ----------------------
function createFloatingPanel() {
  if (document.getElementById("spotter-floating")) return;

  fetch(chrome.runtime.getURL('floating-template.html'))
    .then(res => res.text())
    .then(html => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const floating = wrapper.querySelector('#spotter-floating');
      if (!floating) return;
      document.body.appendChild(floating);

      const styleTag = document.createElement('link');
      styleTag.rel = 'stylesheet';
      styleTag.href = chrome.runtime.getURL('floating-style.css');
      document.head.appendChild(styleTag);

      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('floating.js');
      document.body.appendChild(script);

      setTimeout(() => {
        floating.style.opacity = "1";
        floating.style.transform = "scale(1)";

        floating.querySelector("#start-analysis")?.addEventListener("click", () => {
          chrome.runtime.sendMessage({ action: "startAnalysisFromFloating" });
        });
        floating.querySelector("#stop-analysis")?.addEventListener("click", () => {
          chrome.runtime.sendMessage({ action: "stopAnalysisFromFloating" });
        });
      }, 10);
    })
    .catch(err => console.error("플로팅 패널 생성 실패:", err));
}
