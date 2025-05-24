from flask import Flask, render_template, send_from_directory
import os
from spotter_view import spotter_predict
from flask_cors import CORS

# https 만을 지웒나느 기능을 http 에서 테스트할 때 필요한 설정
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] ='1'

app = Flask(__name__, static_folder="spotter_vue/dist", template_folder='spotter_vue/dist')
CORS(app)

app.register_blueprint(spotter_predict.spotter, url_prefix='/spotter')

# Vue 정적 파일 서빙 및 라우팅 지원
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_vue(path):
    if path != "" and os.path.exists(os.path.join(app.template_folder, path)):
        return send_from_directory(app.template_folder, path)
    else:
        return render_template('index.html')
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)