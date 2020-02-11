import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SocketJs from 'sockjs-client';
import { Mensaje } from './models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;
  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  mensajeEscribiendo: string = '';

  constructor() { }

  ngOnInit() {
    this.client = new Client();

    this.client.webSocketFactory = () => {
      return new SocketJs("http://localhost:8080/chat-websocket");
    }

    this.client.onConnect = (frame) => {
      console.log('Conectados: ' + this.client.connected + ": " + frame);
      this.conectado = true;

      this.client.subscribe('/chat/mensaje', e => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje.fecha = new Date(mensaje.fecha);

        if (!this.mensaje.color && mensaje.tipo == 'nuevo_usuario' && this.mensaje.usuario == mensaje.usuario) {
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);
        console.log(mensaje);
      });

      this.client.subscribe('/chat/escribiendo', e => {
        this.mensajeEscribiendo = e.body;
        setTimeout(() => this.mensajeEscribiendo = '', 4000)
      });

      this.mensaje.tipo = 'nuevo_usuario';
      this.client.publish({
        destination: '/app/mensaje',
        body: JSON.stringify(this.mensaje)
      });
    }

    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + ": " + frame);
      this.conectado = false;
    }
  }

  conectar() {
    this.client.activate();
  }

  desconectar() {
    this.client.deactivate();
  }

  enviarMensaje() {
    this.mensaje.tipo = 'mensaje';
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje)
    });
    this.mensaje.texto = '';
  }

  notificarUsuarioEscribiendo() {
    this.client.publish({
      destination: '/app/escribiendo',
      body: this.mensaje.usuario
    });
  }

}
