import express from "express";
import { Server } from "http";

export class CallbackServer {
  private app: express.Application;
  private server: Server | null = null;
  private port: number;
  private authCode: string | null = null;
  private resolve: ((code: string | null) => void) | null = null;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
  }

  async start(resolveCallback: (code: string | null) => void): Promise<void> {
    this.resolve = resolveCallback;

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`[CallbackServer] Listening on port ${this.port}`);

        // Ruta para captar el callback de OAuth
        this.app.get("/callback", (req, res) => {
          const code = req.query.code as string;
          console.log(`[CallbackServer] Callback received with code: ${code}`);

          if (code) {
            this.authCode = code;
            if (this.resolve) {
              this.resolve(code);
            }
          }

          // Envía una respuesta amigable al usuario
          res.send(`
            <html>
              <head>
                <title>Autenticación exitosa</title>
              </head>
              <body style="font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
                <div style="text-align: center;">
                  <h1>Autenticación exitosa</h1>
                  <p>Puedes cerrar esta ventana y volver a la aplicación.</p>
                </div>
              </body>
            </html>
          `);

          // Cerrar el servidor después de recibir el callback
          setTimeout(() => this.stop(), 2000);
        });

        resolve();
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log("[CallbackServer] Stopped");
    }
  }

  getAuthCode(): string | null {
    return this.authCode;
  }
}
