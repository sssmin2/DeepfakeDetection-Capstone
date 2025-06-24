# 딥러닝 기반 딥페이크 탐지 및 필터링 시스템

## 프로젝트 개요

최근 생성형 AI 기반의 이미지 및 영상 생성 기술이 급격히 발전함에 따라, 현실과 구분이 어려운 수준의 **딥페이크 콘텐츠**가 대중적으로 알려지고 있습니다. 본 프로젝트는 이러한 사회적 이슈에 대응하기 위해 EfficientNet과 Vision Transformer(EViT)의 장점을 결합한 모델을 기반으로 한 **딥페이크 탐지 시스템**을 개발하였습니다.

> 웹 기반 시스템 + 크롬 확장 프로그램으로 구현되어, 사용자가 온라인 영상 시청 중 딥페이크 여부를 **실시간으로 자동 탐지 및 필터링**할 수 있도록 지원합니다.

---

## 시스템 구조

<img width="738" alt="image" src="https://github.com/user-attachments/assets/af1a3696-1ecb-462a-8335-8e5262a02325" />


### Frontend

- 기술 스택: Vue.js
- 기능:
  - 이미지 업로드 UI
  - 예측 결과 시각화
  - 크롬 확장 프로그램 연동
  - YouTube Shorts 영상 실시간 감지 및 블러링 처리
  - 자동 신고 기능 및 탐지 확률 표시

### Backend

- **기술 스택**: Flask, PyTorch, NumPy, OpenCV
- **핵심 기능**:
  - 이미지 전처리 및 예측 수행 (`predict_model`)
  - EfficientNet + Vision Transformer 기반 탐지 모델 적용
  - HTTP 요청/응답 처리로 프론트엔드와 통신

---

## 모델 및 학습

### 사용 모델

- 논문: [Coccomini et al. (2022)](https://link.springer.com/chapter/10.1007/978-3-031-06433-3_20)
- 모델명: `EfficientVit`
- 구조:
  - EfficientNet: 특징 추출
  - Vision Transformer (ViT): 시각 토큰 간 관계 학습
- 학습 방식:
  - 사전학습된 모델을 기반으로 Fine-tuning

### 데이터셋

| 데이터셋         | 구성                                                |
|------------------|-----------------------------------------------------|
| FaceForensics++  | 1000 real + 1000 fake 영상 (YouTube 기반)          |
| Celeb-DF (v2)    | 590 real + 300 real 추가 + 5639 fake 영상           |


- 모든 영상에서 30프레임 간격으로 추출하여 **약 10만 장의 얼굴 이미지 데이터 구성

---

## 실험 결과

총 3가지 설정으로 실험을 진행하였습니다:


<img width="529" alt="image" src="https://github.com/user-attachments/assets/d2c6ca3d-3aa7-4e85-857c-6555f8b15bb3" />



> Fine-tuning이 가장 높은 성능을 보여줌

---

## 기능 요약

- 딥페이크 이미지 실시간 탐지
- 웹 UI 기반 탐지 서비스
- 크롬 확장 프로그램 지원 (YouTube Shorts 감지 및 블러링)
- 자동 신고 기능 및 확률 출력

---

## 향후 계획

- 폭력, 선정성 등 다양한 유해 콘텐츠 탐지 기능 추가
- 사용자 맞춤형 필터링 기능 구현
- 인물별 딥페이크 여부 판단 기능 고도화

---

## 참고문헌

1. Coccomini, D. A., Messina, N., Gennaro, C., & Falchi, F. (2022). *Combining EfficientNet and Vision Transformers for Video Deepfake Detection*. In International Conference on Image Analysis and Processing (pp. 219–229). Springer.
2. Rossler, A., Cozzolino, D., Verdoliva, L., Riess, C., Thies, J., & Nießner, M. (2019). *FaceForensics++: Learning to detect manipulated facial images*. ICCV.
3. Li, Y., Yang, X., Sun, P., Qi, H., & Lyu, S. (2020). *Celeb-DF: A Large-scale Challenging Dataset for DeepFake Forensics*. CVPR.
"""
