#library,module import
import torch
import cv2 as cv
from PIL import Image
import os
from .efficient_vit import EfficientViT
from torchvision import transforms
import yaml
from facenet_pytorch import MTCNN
import time


class DeepfakeDetector():
    def __init__(self,model_path):
        #전처리 초기화
        self.transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5094, 0.3556, 0.3192],
                             std=[0.2126, 0.1545, 0.1448])
        ])
        
        #모델 설정값
        efficient_net = 0
        channels = 1280 if efficient_net ==0 else 2560 #EfficientNet-B0 == 1280 , EfficientNet-B7 == 2560
        
        config_path = os.path.join(os.path.dirname(__file__), 'architecture.yaml')
        with open(config_path, 'r') as ymlfile:
            config = yaml.safe_load(ymlfile)

        #모델로드하기
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = EfficientViT(config=config, channels=channels, selected_efficient_net = efficient_net)
        self.model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        self.model.to(self.device)
        self.model.eval()

    #동영상인경우 프레임추출
    def extract_frames(self,video_path):
        cap = cv.VideoCapture(video_path) #비디오를 불러봐~        
        frame_count = 0 #프레임 셀거
        pil_frames = [] #프레임들 저장할거임임

        #비디오 진행 동안에만 츄르츄르르
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % 50 == 0:#30프레임마다
                #opencv는 이미지를 bgr로 읽기 떄문에 바꿔준다람쥐
                frame_rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)          
                pil_frame = Image.fromarray(frame_rgb)#하나의 프레임을 pil 객체로변환환
                pil_frames.append(pil_frame)#변환된 pil객체들을 리스트에 추가
            
            frame_count += 1 #다음 프레임으로 넘김김

        cap.release()           
        return pil_frames #pil객체들이 들어있는 리스트를 반환환




    #동영상인 경우 동영상에서 프레임을 추출한다.
    def predict_video(self,processed_frames):
        predictions = [] # 예측값들
        probs = []
        
        start_time = time.time()
        
        for frame in processed_frames:
            label, prob = self.predict_frame(frame)
            predictions.append(label)
            probs.append(prob.item())
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"예측 시간: {elapsed_time:.2f}초")

        print("예측 결과 리스트:", predictions) #확인용용

        real_count = predictions.count("real")
        fake_count = predictions.count("fake")

        avg_prob = sum(probs) / len(probs) if probs else 0.5  # 평균 확률값

        final_result = "fake" if fake_count > real_count else "real"
        print(final_result, torch.tensor([avg_prob]))
        return final_result, torch.tensor([avg_prob])

    #경로가 아니라 pil객체를 받도록수정정
    def crop_face_from_image(self,pil_img):
        mtcnn = MTCNN(image_size=224, margin=20)  # 얼굴 감지기 생성

        face_tensor = mtcnn(pil_img)
        if face_tensor is not None:
            face_pil = transforms.ToPILImage()(face_tensor)
            # face_pil.show()
            return face_pil
        else:
            return None
    


    #전처리를 적용한다.(입력으로 이미지 np배열을 받음 )
    def preprocess_frame(self, img):
        tensor = self.transform(img) #이때 텐서로 변환
        tensor = tensor.unsqueeze(0).to(self.device)
        return tensor


    #하나의 프레임을 받아 예측값을 반환한다.
    def predict_frame(self,preprocessed_img):
        with torch.no_grad():  # 추론 시에는 gradient 계산 안 하도록
            output = self.model(preprocessed_img)
            prob = torch.sigmoid(output)            
            pred = 1 if prob.item() > 0.5 else 0
                         
        result = "real" if pred == 0 else "fake"

        return result, prob.cpu().numpy()



        