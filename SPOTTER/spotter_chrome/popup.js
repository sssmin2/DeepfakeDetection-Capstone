// 탭 전환 함수
function openTab(tabName) {
  document.querySelectorAll('.tab, .menu-bt').forEach(function (el) {
    el.classList.remove('activate');
  });

  document.getElementById(tabName).classList.add('activate');
  document.querySelector('.menu-bt[data-tab="' + tabName + '"]').classList.add('activate');

  // opertate-tab 클릭하면 floating 띄우기
  if (tabName === "opertate-tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggleFloating" });
    });
  }
}

// 탭 버튼들에 클릭 이벤트 연결
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('.menu-bt').forEach(button => {
    button.addEventListener("click", function () {
      const tabName = this.getAttribute("data-tab");
      openTab(tabName);
    });
  });
});

