chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[content.js] 메시지 수신:", message); // ← 이 로그 찍히는지 확인
  if (message.action === "startAnalysisFromFloating") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "startAnalysis" });
    });
  }

  if (message.action === "stopAnalysisFromFloating") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopAnalysis" });
    });
  }
});
