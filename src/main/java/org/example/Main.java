package org.example;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.Cookie;
import io.javalin.http.ForbiddenResponse;
import io.javalin.http.SameSite;
import io.javalin.http.UnauthorizedResponse;
import io.javalin.plugin.bundled.CorsPluginConfig;
import org.example.dto.FormularioRequest;
import org.example.dto.LoginRequest;
import org.example.dto.UsuarioRequest;
import org.example.dto.UsuarioResponse;
import org.example.grpc.FormularioGrpcServiceImpl;
import org.example.model.Usuario;
import org.example.repository.FormularioRepository;
import org.example.repository.UsuarioRepository;
import org.example.services.FormularioService;
import org.example.services.UsuarioService;
import org.example.util.JwtFilter;
import org.example.util.JwtUtil;
import org.example.websocket.WsFormularioHandler;

import java.io.IOException;
import java.util.Map;

import static io.javalin.apibuilder.ApiBuilder.*;

/*
* Clase donde se inicializa practicamente to y se configura las rutas
* No es la version final y puedo estar sujeto a cualquier tipo de cambio
* */
public class Main {

    static void main() {

        //repositorios, servicios y websockets del sistema
        UsuarioRepository usuarioRepository =  new UsuarioRepository();
        FormularioRepository formularioRepository = new FormularioRepository();
        UsuarioService usuarioService = new UsuarioService(usuarioRepository);
        FormularioService formularioService = new FormularioService(formularioRepository, usuarioRepository);
        WsFormularioHandler wsHandler = new WsFormularioHandler(formularioService);
        usuarioService.crearAdminDefaultSiNoExiste();

        //servidor gRPC
        io.grpc.Server grpcServer;
        try {
            grpcServer = io.grpc.ServerBuilder
                .forPort(9090)
                .addService(new FormularioGrpcServiceImpl(formularioRepository, usuarioRepository))
                    .maxInboundMessageSize(1024 * 1024 * 20)
                .build()
                .start();
            System.out.println("gRPC escuchando en puerto 9090");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        Javalin app = Javalin.create(javalinConfig -> {

            //configuracion de CORS
            javalinConfig.bundledPlugins.enableCors(cors ->
                    cors.addRule(regla -> {
                        regla.allowHost(
                                "http://localhost:5173",
                                "http://127.0.0.1:5173",
                                "http://localhost:4173",
                                "http://127.0.0.1:4173",
                                "https://jsea.me",
                                "https://www.jsea.me",
                                "165.227.204.150"
                        );
                        regla.allowCredentials = true;
                    }));

            //configuracion de rutas
            javalinConfig.routes.apiBuilder(() -> path("/api", () -> {

                //Rutas publicas
                //login
                path("/auth", () -> {
                    post("/login", ctx -> {
                        LoginRequest req = ctx
                                .bodyAsClass(LoginRequest.class);
                        Usuario usuario = usuarioService
                                .login(req.email, req.password);
                        guardarTokenEnCookie(ctx, JwtUtil.generarToken(usuario));
                        ctx.json(Map.of(
                                "usuario", UsuarioResponse.from(usuario)
                        ));
                    });

                    get("/me", ctx -> {
                        JwtFilter.validar(ctx);
                        String usuarioId = ctx.attribute("usuarioId");
                        ctx.json(Map.of(
                                "usuario", usuarioService.buscarUsuarioPorId(usuarioId)
                        ));
                    });

                    post("/logout", ctx -> {
                        limpiarTokenCookie(ctx);
                        ctx.status(204);
                    });
                });

                //Rutas restringidas
                //formularios
                path("/formularios", () -> {

                    post(ctx -> {
                        JwtFilter.validar(ctx);
                        String usuarioId = ctx.attribute("usuarioId");
                        FormularioRequest request =
                                ctx.bodyAsClass(FormularioRequest.class);
                        ctx.status(201).json(
                                formularioService.registrar(request, usuarioId)
                        );
                    });

                    get(ctx -> {
                        JwtFilter.validar(ctx);
                        ctx.json(formularioService.listarTodos());
                    });

                    get("/mis-registros", ctx -> {
                        JwtFilter.validar(ctx);
                        String usuarioId = ctx.attribute("usuarioId");
                        ctx.json(
                                formularioService.listarPorUsuario(usuarioId)
                        );
                    });

                    path("/{id}", () -> {

                        put(ctx -> {
                            JwtFilter.validar(ctx);
                            String id = ctx.pathParam("id");
                            FormularioRequest request =
                                ctx.bodyAsClass(FormularioRequest.class);
                            ctx.json(
                                formularioService.actualizar(id, request)
                            );
                        });

                        delete(ctx -> {
                            JwtFilter.validar(ctx);
                            formularioService.eliminar(
                                ctx.pathParam("id")
                            );
                            ctx.status(204);
                        });

                        patch("/sincronizar", ctx -> {
                            JwtFilter.validar(ctx);
                            formularioService.marcarSincronizado(
                                    ctx.pathParam("id")
                            );
                            ctx.status(200).json(
                                Map.of("mensaje", "Formulario sincronizado")
                            );
                        });
                    });
                });

                //Rutas de acceso exclusivos para admin
                //Usuarios
                path("usuarios", () -> {

                    post(ctx -> {
                        JwtFilter.validarAdmin(ctx);
                        UsuarioRequest request =
                            ctx.bodyAsClass(UsuarioRequest.class);
                        Boolean esAdmin = Boolean.parseBoolean(
                            ctx.queryParam("admin")
                        );
                        UsuarioResponse actor = usuarioService.buscarUsuarioPorId(
                            ctx.attribute("usuarioId")
                        );
                        ctx.status(201).json(
                            usuarioService.registrarUsuario(
                                    request, actor, esAdmin)
                        );
                    });

                    get(ctx -> {
                        JwtFilter.validarAdmin(ctx);
                        ctx.json(usuarioService.listarActivos());
                    });

                    path("/{id}", () -> {
                        put(ctx -> {
                            JwtFilter.validarAdmin(ctx);
                            UsuarioResponse actor = usuarioService.buscarUsuarioPorId(
                                ctx.attribute("usuarioId")
                            );
                            UsuarioRequest request =
                                ctx.bodyAsClass(UsuarioRequest.class);
                            Boolean esAdmin = Boolean.parseBoolean(
                                ctx.queryParam("admin")
                            );
                            ctx.json(usuarioService.actualizarUsuario(
                                ctx.pathParam("id"), request, actor, esAdmin
                            ));
                        });

                        delete(ctx -> {
                            JwtFilter.validarAdmin(ctx);
                            usuarioService.desactivar(
                                    ctx.pathParam("id")
                            );
                            ctx.status(204);
                        });

                    });

                });

                ws("/ws/sync", ws -> {
                    ws.onConnect(wsHandler::onConnect);
                    ws.onMessage(wsHandler::onMessage);
                    ws.onClose(wsHandler::onClose);
                    ws.onError(wsHandler::onError);
                });

            }));

            //metodos para manejar errores
            javalinConfig.routes.exception(IllegalArgumentException.class, (e, ctx) -> {
                ctx.status(400).json(Map.of("error", e.getMessage()));
            });

            javalinConfig.routes.exception(UnauthorizedResponse.class, (e, ctx) -> {
                ctx.status(401).json(Map.of("error", e.getMessage()));
            });

            javalinConfig.routes.exception(ForbiddenResponse.class, (e, ctx) -> {
                ctx.status(403).json(Map.of("error", e.getMessage()));
            });

            javalinConfig.routes.exception(Exception.class, (e, ctx) -> {
                ctx.status(500).json(Map.of("error", "Error interno"));
            });
        });

        app.start(7070);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Apagando gRPC...");
            grpcServer.shutdown();
        }));

        try {
            grpcServer.awaitTermination();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    private static void guardarTokenEnCookie(Context ctx, String token) {
        ctx.cookie(new Cookie(
                JwtUtil.COOKIE_NAME,
                token,
                "/",
                JwtUtil.COOKIE_MAX_AGE_SECONDS,
                false,
                true,
                null,
                SameSite.LAX
        ));
    }

    private static void limpiarTokenCookie(Context ctx) {
        ctx.cookie(new Cookie(
                JwtUtil.COOKIE_NAME,
                "",
                "/",
                0,
                false,
                true,
                null,
                SameSite.LAX
        ));
    }
}
