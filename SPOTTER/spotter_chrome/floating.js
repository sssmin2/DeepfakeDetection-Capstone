function initFloatingFeatures() {
  const floating = document.getElementById("spotter-floating");
  const dragBar = document.getElementById("drag-bar");
  const collapseBtn = document.getElementById("collapse-btn");
  const content = document.getElementById("floating-content");

  if (!floating || !dragBar || !collapseBtn || !content) {
    console.warn("❌ [Spotter] 필수 요소 누락, 플로팅 기능 초기화 실패");
    return;
  }

  // 탭 기능
  document.querySelectorAll('.menu-bt').forEach(button => {
    button.addEventListener("click", function () {
      const tabName = button.getAttribute("data-tab");

      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove("activate"));
      document.querySelectorAll('.menu-bt').forEach(btn => btn.classList.remove("activate"));

      const activeTab = document.getElementById(tabName);
      if (activeTab) activeTab.classList.add("activate");
      button.classList.add("activate");
    });
  });

  // 드래그 기능
  let isDragging = false, offsetX = 0, offsetY = 0;

  dragBar.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - floating.offsetLeft;
    offsetY = e.clientY - floating.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      floating.style.left = `${x}px`;
      floating.style.top = `${y}px`;
      localStorage.setItem("floating_left", `${x}px`);
      localStorage.setItem("floating_top", `${y}px`);
    }
  });

  document.addEventListener("mouseup", () => isDragging = false);

  // 닫기 버튼
  document.getElementById("close-btn")?.addEventListener("click", () => {
    floating.style.opacity = "0";
    floating.style.transform = "scale(0.9)";
    setTimeout(() => floating.remove(), 300);
  });

  // 접기 버튼
  collapseBtn.addEventListener("click", () => {
    if (content.style.display === "none") {
      content.style.display = "block";
      collapseBtn.textContent = "_";
    } else {
      content.style.display = "none";
      collapseBtn.textContent = "▣";
    }
  });
}

// 외부에서 탭 열기 지원
function openFloatingTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove("activate"));
  document.querySelectorAll('.menu-bt').forEach(btn => btn.classList.remove("activate"));

  document.getElementById(tabId)?.classList.add("activate");
  document.querySelector(`.menu-bt[data-tab="${tabId}"]`)?.classList.add("activate");
}

window.addEventListener("message", (event) => {
  if (event.data?.type === "SPOTTER_OPEN_TAB") {
    openFloatingTab(event.data.tabId);
  }

  if (event.data?.type === "SPOTTER_RENDER_LIST") {
    fetchDownloadedList(); // 서버에서 최신 리스트 불러옴
  }
});

async function fetchDownloadedList() {
  try {
    const res = await fetch("http://localhost:8080/spotter/list_downloads");
    const data = await res.json();
    const listBox = document.getElementById("recent-list");
    if (!listBox || !data.downloaded_files) return;

    listBox.replaceChildren(...data.downloaded_files.slice(-3).map(filePath => {
      const li = document.createElement("li");
      li.textContent = filePath.split('/').pop(); // 파일명만 표시
      return li;
    }));
  } catch (err) {
    console.error("다운로드 리스트 불러오기 실패:", err);
  }
}

initFloatingFeatures();
