package org.example;

import io.javalin.Javalin;
import io.javalin.plugin.bundled.CorsPluginConfig;
import org.example.dto.FormularioRequest;
import org.example.dto.LoginRequest;
import org.example.dto.UsuarioRequest;
import org.example.dto.UsuarioResponse;
import org.example.model.Usuario;
import org.example.repository.FormularioRepository;
import org.example.repository.UsuarioRepository;
import org.example.services.FormularioService;
import org.example.services.UsuarioService;
import org.example.util.JwtFilter;
import org.example.util.JwtUtil;
import org.example.websocket.WsFormularioHandler;

import java.util.Map;

import static io.javalin.apibuilder.ApiBuilder.*;

/*
* Clase donde se inicializa practicamente to y se configura las rutas
* No es la version final y puedo estar sujeto a cualquier tipo de cambio
* */
public class Main {

    static void main() {

        UsuarioRepository usuarioRepository =  new UsuarioRepository();
        FormularioRepository formularioRepository = new FormularioRepository();
        UsuarioService usuarioService = new UsuarioService(usuarioRepository);
        FormularioService formularioService = new FormularioService(formularioRepository, usuarioRepository);
        WsFormularioHandler wsHandler = new WsFormularioHandler(formularioService);


        Javalin app = Javalin.create(javalinConfig -> {

            //configuracion de CORS
            javalinConfig.bundledPlugins.enableCors(cors ->
                    cors.addRule(CorsPluginConfig.CorsRule::anyHost));

            //configuracion de rutas
            javalinConfig.routes.apiBuilder(() -> path("/api", () -> {

                //Rutas publicas
                //login
                path("/auth", () -> post("/login", ctx -> {
                    LoginRequest req = ctx
                            .bodyAsClass(LoginRequest.class);
                    Usuario usuario = usuarioService
                            .login(req.email, req.password);
                    ctx.json(Map.of(
                            "token", JwtUtil.generarToken(usuario),
                            "usuario", Map.of(
                                    "id", usuario.getId().toHexString(),
                                    "nombre", usuario.getNombre(),
                                    "rol", usuario.getRol().name()
                            )
                    ));
                }));

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
                            ctx.pathParam("admin")
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
                            JwtFilter.validar(ctx);
                            UsuarioResponse actor = usuarioService.buscarUsuarioPorId(
                                ctx.attribute("usuarioId")
                            );
                            UsuarioRequest request =
                                ctx.bodyAsClass(UsuarioRequest.class);
                            Boolean esAdmin = Boolean.parseBoolean(
                                ctx.pathParam("admin")
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

                    ws("/ws/sync", ws -> {
                        ws.onConnect(wsHandler::onConnect);
                        ws.onMessage(wsHandler::onMessage);
                        ws.onClose(wsHandler::onClose);
                        ws.onError(wsHandler::onError);
                    });
                });
            }));

            //metodos para manejar errores
            javalinConfig.routes.exception(IllegalArgumentException.class, (e, ctx) -> {
                ctx.status(400).json(Map.of("error", e.getMessage()));
            });

            javalinConfig.routes.exception(Exception.class, (e, ctx) -> {
                ctx.status(500).json(Map.of("error", "Error interno"));
            });
        });

        app.start(7070);
    }
}
