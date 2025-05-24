from flask import Flask, Blueprint, request, jsonify
from pathlib import Path
from werkzeug.utils import secure_filename
import os
from spotter_model.detector import DeepfakeDetector
from PIL import Image
import uuid
import yt_dlp
import cv2

# 블루프린트 생성
spotter = Blueprint('spotter', __name__, template_folder='dist', static_folder='dist/assets')

# 정적 폴더 확인 및 생성
upload_dir = os.path.join('static/uploads')
os.makedirs(upload_dir, exist_ok=True)

# 모델
detector = DeepfakeDetector("spotter_model/efficientnetB0_epoch50.pth")
    
# 이미지/영상 파일 업로드 및 분석
@spotter.route('/predicted', methods=['POST'])
def predicted():
    print("요청 들어옴")
    # 업로드 파일 확인
    if 'file' not in request.files:
        return jsonify({'error': 'No files'}), 400
    
    file = request.files['file']
    if file.filename == '': #선택된 파일 이름 비어있으면
        return jsonify({'error': 'No selected file'}), 400
    
    # 파일명 안전하게 처리
    secure_name = secure_filename(file.filename)
    # 정적 폴더에 저장
    upload_path = os.path.join('static/uploads', secure_name) #저장할 폴더 생성
    file.save(upload_path)

    try:
        ext = os.path.splitext(secure_name)[-1].lower()
        
        # 이미지인 경우
        if ext in ['.jpg', '.jpeg', '.png']:
            pil_img = Image.open(upload_path).convert("RGB")
            cropped_img = detector.crop_face_from_image(pil_img)
            processed_img = detector.preprocess_frame(cropped_img)
            result, prob = detector.predict_frame(processed_img)

        # 동영상인 경우
        elif ext in ['.mp4', '.avi', '.mov']:
            pil_frames = detector.extract_frames(upload_path)
            cropped_frames = [detector.crop_face_from_image(f) for f in pil_frames if detector.crop_face_from_image(f) is not None]
            processed_frames = [detector.preprocess_frame(f) for f in cropped_frames]
            result,prob = detector.predict_video(processed_frames)
            

        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        return final_response(result, prob)

    except Exception as e:
        print(f"탐지 중 오류 발생: {str(e)}")
        return jsonify({'error': f'탐지 중 오류 발생: {str(e)}'}), 500

# 쇼츠 분석
@spotter.route('/shorts_video', methods=['POST'])
def shorts_video():
    print("유튜브 요청 들어옴")
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': '유튜브 URL 필요'}), 400

    youtube_url = data['url']

    try:
        # 고유인식? 파일 이름 생성
        video_id = str(uuid.uuid4())
        video_path = os.path.join(upload_dir, f"{video_id}.mp4")

        # yt-dlp 설정
        ydl_opts = {
            'outtmpl': video_path,
            'format': 'mp4[ext=mp4]+bestaudio/best',
            'quiet': True,
            'merge_output_format': 'mp4',
        }

        # 다운로드
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])

        # 딥페이크 탐지
        frames = detector.extract_frames(video_path)
        cropped_frames = [detector.crop_face_from_image(f) for f in frames if detector.crop_face_from_image(f) is not None]
        processed_frames = [detector.preprocess_frame(f) for f in cropped_frames]
        result, prob = detector.predict_video(processed_frames)

        # 딥페이크일 경우 신고 로그 저장
        if result == "fake":
            with open("reported_videos.log", "a", encoding="utf-8") as f:
                f.write(f"{youtube_url}\n")

        return final_response(result, prob)

    except Exception as e:
        print(f"[쇼츠 분석 에러] {e}")
        return jsonify({'error': str(e)}), 500

# 쇼츠, 이미지/영상 response
def final_response(result, prob):
    prob_value = float(prob.item())
    detection_result = "진짜" if result == "real" else "딥페이크"
    fake_prob = prob_value * 100
    real_prob = (1 - prob_value) * 100
    probability = f"{real_prob:.2f}% 진짜, {fake_prob:.2f}% 가짜"

    return jsonify({
        'result': detection_result,
        'probability': probability,
        'raw_probs': {
            'real': real_prob,
            'fake': fake_prob
        }
    })