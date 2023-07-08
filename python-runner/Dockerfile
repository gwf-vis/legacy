FROM python:3.9-slim

RUN useradd -m pyrunner
USER pyrunner

WORKDIR ~/app

USER root
RUN chmod 777 .
USER pyrunner

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python", "./server.py" ]
EXPOSE 8000