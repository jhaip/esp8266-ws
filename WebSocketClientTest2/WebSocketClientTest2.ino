/*
 * WebSocketClient.ino
 *
 *  Created on: 24.05.2015
 *
 */

#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <WebSocketsClient.h>

#include <Hash.h>

#include <math.h>

ESP8266WiFiMulti WiFiMulti;
WebSocketsClient webSocket;


#define USE_SERIAL Serial

void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght) {


    switch(type) {
        case WStype_DISCONNECTED:
            USE_SERIAL.printf("[WSc] Disconnected!\n");
            break;
        case WStype_CONNECTED:
            {
                USE_SERIAL.printf("[WSc] Connected to url: %s\n",  payload);
            }
            break;
        case WStype_TEXT:
            USE_SERIAL.printf("[WSc] get text: %s\n", payload);

            // send data to back to Server
            //webSocket.sendTXT(payload, lenght);
            break;
        case WStype_BIN:
            USE_SERIAL.printf("[WSc] get binary lenght: %u\n", lenght);
            hexdump(payload, lenght);

            // echo data back to Server
            //webSocket.sendBIN(payload, lenght);
            break;
    }

}


void setup() {
    // USE_SERIAL.begin(921600);
    USE_SERIAL.begin(115200);

    //Serial.setDebugOutput(true);
    USE_SERIAL.setDebugOutput(true);

    USE_SERIAL.println();
    USE_SERIAL.println();
    USE_SERIAL.println();

      for(uint8_t t = 4; t > 0; t--) {
          USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
          USE_SERIAL.flush();
          delay(1000);
      }

    WiFiMulti.addAP("STALY2.4", "1 am a tr33");

    //WiFi.disconnect();
    while(WiFiMulti.run() != WL_CONNECTED) {
        delay(100);
    }

    webSocket.begin("192.168.1.14", 81);
    webSocket.onEvent(webSocketEvent);
    delay(50);
    webSocket.sendTXT("{'type':'BREAK','value':'BOOT'}");
    webSocket.loop();
}

int count = 0;

void loop() {
    webSocket.loop();
    count += 1;
    if (count < 100) {
      webSocket.sendTXT("{'type':'BREAK','value':'LOOP'}");
      delay(20);
      webSocket.sendTXT("{'type':'BINARY', 'label':'A0', 'value':0}");
      webSocket.sendTXT("{'type':'BINARY', 'label':'D1', 'value':0}");
      delay(40);
      if (!digitalRead(0)) {
        int val = (count % 11)*(2 + count % 7);//(int)sin((double)count/10.)*100;
        webSocket.sendTXT("{'type':'BINARY', 'label':'A0', 'value':"+String(val)+"}");
        //webSocket.sendTXT("val="+String(val)+" "+micros());
      }
      delay(20);
    }
    if (count == 100) {
      webSocket.sendTXT("{'type':'BREAK','value':'END'}");
    }
}
