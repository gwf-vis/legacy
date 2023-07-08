import signal
import time
from flask import Flask, request, json
from flask_cors import CORS
import sys
import os
import subprocess

app = Flask(__name__)
CORS(app)

RUNNER_TIMEOUT = 5
RUNNER_TIMEOUT_ERROR_MESSAGE = '=== You script process is killed as it took too long to run. ==='


@app.route('/run', methods=['POST'])
def run():
    text = request.data.decode("utf-8")
    filePath = f'temp_{int(time.time() * 10000000)}.py'
    with open(filePath, 'w+') as file:
        file.write(text)
    resultFilePath = f'{filePath}.result'
    myEnv = os.environ
    myEnv['RESULT_FILE_PATH'] = resultFilePath
    runner_timeout = False
    try:
        runner_process = subprocess.Popen(
            ['python3', filePath], env=myEnv, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        runner_process.wait(timeout=RUNNER_TIMEOUT)
        (stdout, stderr) = runner_process.communicate()
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(runner_process.pid), signal.SIGKILL)
        runner_timeout = True
    os.remove(filePath)
    result = ''
    try:
        with open(resultFilePath) as file:
            result = file.read()
        os.remove(resultFilePath)
    except:
        pass
    return json.dumps({
        'output': RUNNER_TIMEOUT_ERROR_MESSAGE if runner_timeout else stdout.decode('utf-8') + '\n' + stderr.decode('utf-8'),
        'result': json.loads(result) if result else None
    })


if __name__ == '__main__':
    try:
        port = int(sys.argv[1])  # This is for a command-line input
    except:
        port = 8000
    app.run(port=port, host="0.0.0.0")
