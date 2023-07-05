######### Estabelece a comunicação entre o template HTML5 e o Arduino ########

import sys
import glob
import time
import serial
import threading
import eventlet
import socketio
import asyncio
import atexit
from pyfirmata import Arduino, util
from sanic import Sanic
from sanic.response import html

# Variáveis Globais
SOCKETIO = ''
SERIAL_COM = ''
SOCKET_PORT = 8181
ARDUINO_BOARD = False
ARDUINO_ERRO = False
THR_SOCKET = ''
THR_CHECK_ARDUINO = ''
REMOTE_KEY = ''
pin8 = 0
pin9 = 0
pin10 = 0
pin11 = 0
AWAY = 0

# Inicia o Gateway
def start():
    global THR_SOCKET
    print('[SISTEMA] Iniciando o gateway (HTML/Arduino)')

    # Mantém o programa sempre ativo
    threading.Thread(target=keepAlive,).start()

    # Monitora o encerramento da aplicação
    threading.Thread(target=onClose,).start()

    #Abre o Socket de comunicação com o HTML5
    THR_SOCKET = threading.Thread(target=openSocket,)
    THR_SOCKET.start()

    #Inicia a comunicação com o Arduino
    while True:

        #Libera a posta serial caso esteja em uso
        closeArduino()

        try:
            #Seleciona a porta serial
            selectSerialPort()

            if SERIAL_COM != '':
                # Estabelece a conexão com o Arduino
                connectToArduino()
                
        except Exception as e:
            print(str(e))
            pass

        print('[ARDUINO] ! Nova tentativa de conexão em 5s...')
        time.sleep(5)

# Mantém a aplicação sempre ativa
def keepAlive():
    global AWAY
    global ARDUINO_ERRO
    while True:
        print("[SISTEMA] Tempo ocioso:  "+str(AWAY)+"s")
        time.sleep(30)
        AWAY += 30

        # Se a aplicação ficar ociosa por mais de 10 minutos, reinicia a comunicação
        if AWAY > 600:
            print("[SISTEMA] (!) Reiniciando a conexão por falta de interação")
            ARDUINO_ERRO = True;
            AWAY = 0

#################################### SOCKET.IO ####################################

#Abre o Socket de comunicação com o HTML5
def openSocket():
    global SOCKETIO
    global REMOTE_KEY

    # Inicia o serviço
    SOCKETIO = socketio.AsyncServer(async_mode='sanic', cors_allowed_origins=['*', 'http://localhost', 'http://localhost:83'])
    app = Sanic()
    SOCKETIO.attach(app)

    # Envia o comando ao template em HTML
    async def sendRemoteKey():
        global REMOTE_KEY
        while True:
            if REMOTE_KEY != '':
                print('[SOCKETIO] Enviando tecla: '+REMOTE_KEY)
                await SOCKETIO.emit('sendRemoteKey', {'key': REMOTE_KEY})
                REMOTE_KEY = ''

            await SOCKETIO.sleep(.5)

    # Coloca o evento de escuta em background
    @app.listener('before_server_start')
    def before_server_start(sanic, loop):
        taskSendKey = SOCKETIO.start_background_task(sendRemoteKey)

    # Evento - Conectado
    @SOCKETIO.event
    async def connect(sid, environ):
        await SOCKETIO.emit('my_response', {'data': 'Connected', 'count': 0}, room=sid)

    # Evento - Desconectado
    @SOCKETIO.event
    def disconnect(sid):
        print('[SOCKET] (!) Cliente HTTP desconectado')

    if __name__ == '__main__':
        app.run(host="127.0.0.1", port=SOCKET_PORT) 

#################################### ARDUINO ####################################

#Seleciona a porta COM
def selectSerialPort():
    print('[ARDUINO] (ok) Buscando porta serial')
    global ARDUINO_BOARD
    global SERIAL_COM

    # Identifica as portas em uso
    ports = ['COM%s' % (i + 1) for i in range(256)]
    result = []
    for port in ports:
        try:
            s = serial.Serial(port)
            s.close()
            result.append(port)
        except Exception as e:
            #print(str(e))
            pass;
    success = len(result) > 0

    if success == True:
        # Sucesso
        for port in result:

            # Checa se a porta está associada a um Arduino
            ARDUINO_BOARD = Arduino(port)
            if str(ARDUINO_BOARD.get_firmata_version()) != "None":
                ARDUINO_BOARD.exit()
                SERIAL_COM = port
                print("[ARDUINO] (ok) Encontrado 1 dispositivo conectado na porta: " + SERIAL_COM);
        
    else:
        # Erro
        print("[ARDUINO] (X) Não foi encontrado um dispositivo Arduino conectado");

# Estabelece a conexão com o Arduino
def connectToArduino():
    global SERIAL_COM
    global ARDUINO_BOARD
    global ARDUINO_ERRO
    
    try:
        ARDUINO_BOARD = Arduino(SERIAL_COM)
        it = util.Iterator(ARDUINO_BOARD)
        it.start()
        success = True;
        ARDUINO_ERRO = False
    except:
        success = False;

    if success == True:
        # Sucesso
        print('[ARDUINO] (ok) Conexão com o Arduino ('+str(SERIAL_COM)+') bem-sucedida')

        # Monitora a conectividade com o Arduino
        global THR_CHECK_ARDUINO
        THR_CHECK_ARDUINO = threading.Thread(target=checkArduino,)
        THR_CHECK_ARDUINO.start()
        
        # Conecta ao sensor de controle remoto
        connectToSensor()
    else:
        # Erro
        print('[ARDUINO] (X) Falha na tentativa de conexão com o Arduino ('+str(SERIAL_COM)+')')

# Conecta ao sensor de controle remoto RF433
def connectToSensor():
    global ARDUINO_BOARD
    global pin8
    global pin9
    global pin10
    global pin11
    
    try:
        # Define os pinos onde o sensor esta conectado
        pin8 = ARDUINO_BOARD.get_pin('d:8:i')
        pin9 = ARDUINO_BOARD.get_pin('d:9:i')
        pin10 = ARDUINO_BOARD.get_pin('d:10:i')
        pin11 = ARDUINO_BOARD.get_pin('d:11:i')
        success = True
    except:
        success = False

    if success == True:
        # Sucesso
        print('[ARDUINO] (ok) Comunicação com o sensor RF433 bem-sucedida')

        #Inicia o monitoramento do controle remoto
        monitorRemoteControl()
        #threading.Thread(target=monitorRemoteControl).start()
    else:
        #Erro
        print('[ARDUINO] (X) Falha na tentativa de comunicação com o sensor RF433')
        
# Monitora o uso do controle RF433
def monitorRemoteControl():
    print('[ARDUINO] (ok) Monitoramento do controle RF433 iniciado...')
    global ARDUINO_BOARD
    global ARDUINO_ERRO
    global REMOTE_KEY
    global pin8
    global pin9
    global pin10
    global pin11
    global AWAY
    press = False
    tmpRemoteKey = ''

    while True:
        pin8Rs = pin8.read();
        pin9Rs = pin9.read();
        pin10Rs = pin10.read();
        pin11Rs = pin11.read();
        if pin10Rs == 1:
            tmpRemoteKey = 'A'
            press = True
        if pin8Rs == 1:
            tmpRemoteKey = 'B'
            press = True
        if pin11Rs == 1:
            tmpRemoteKey = 'C'
            press = True
        if pin9Rs == 1:
            tmpRemoteKey = 'D'
            press = True

        if tmpRemoteKey != '':
            print('[ARDUINO] Tecla pressionada: '+tmpRemoteKey)
            REMOTE_KEY = tmpRemoteKey
            AWAY = 0;
            tmpRemoteKey = ''

        #Atraso
        if press == True:
            delay = 1
            press = False
        else:
            delay = .005
        time.sleep(delay)

        # Em caso de erro encerra o loop
        if ARDUINO_ERRO == True:
            print('[ARDUINO] (X) Perda de comunicação com o Arduino')
            break

# Monitora a conectividade com o Arduino
def checkArduino():
    global SERIAL_COM
    global ARDUINO_ERRO
    
    erro = ''
    while threading.main_thread().is_alive():
        try:    
            s = serial.Serial(SERIAL_COM)
            s.close()
        except Exception as e:
            erro  = str(e)
            
        # Verifica a mensagem de erro
        if erro != '' and 'PermissionError' in erro:
            pass
        else:
            ARDUINO_ERRO = True;
            break
        
        time.sleep(10)

# Encerra a comunicação com o Arduino
def closeArduino():
    try:
        ARDUINO_BOARD.exit()
    except:
        pass

# Monitora o encerramento da aplicação
def onClose():
    global THR_SOCKET
    while threading.main_thread().is_alive():
        time.sleep(5)

    # Encerra outras threads
    print('! Encerrando threads')
    if THR_SOCKET.isAlive() == True:
        THR_SOCKET.deamon()

# Executa a aplicação
start()
