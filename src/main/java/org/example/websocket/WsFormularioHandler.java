package org.example.websocket;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.javalin.websocket.*;
import org.example.dto.FormularioRequest;
import org.example.dto.FormularioResponse;
import org.example.services.FormularioService;
import org.example.util.JwtUtil;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class WsFormularioHandler {
    private final FormularioService formularioService;

    public WsFormularioHandler(FormularioService formularioService) {
        this.formularioService = formularioService;
    }

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    //Mapa de sesion activas
    private final ConcurrentHashMap<String, WsContext> sesiones = new ConcurrentHashMap<>();

    public void onConnect(WsConnectContext ctx)
    {
        //se pide el token de la sesion
        String token = ctx.queryParam("token");

        //y luego obtiene el id del usuario asociado al token y se valida
        String usuarioId = JwtUtil.extraerUsuarioId(token);
        if(usuarioId == null){
            ctx.closeSession(1008, "Token invalido");
            return;
        }

        //Guardar la sesion asociada al usuario
        ctx.attribute("usuarioId", usuarioId);
        sesiones.put(usuarioId, ctx);

        System.out.println("WS conectado: " + usuarioId);
    }

    //Cuando se recibe mensaje, o mas bien el formulario a sincronizar
    public void onMessage(WsMessageContext ctx)
    {
        String usuarioId = ctx.attribute("usuarioId");
        if(usuarioId == null){
            enviarError(ctx, "Sesion no autenticada");
            return;
        }

        try {
            //Parsear el mensaje como FormularioRequest
            FormularioRequest request = objectMapper.readValue(ctx.message(), FormularioRequest.class);

            //Guardar en MongoDB usando el service
            FormularioResponse guardado = formularioService.registrar(request, usuarioId);

            /* Esta parte es para confirmarle al cliente que el formulario ha sido sincronizado
            * correctamente. Se usa el ID generado por MongoDB y el cliente usara este ID para
            * marcar el registro como sincronizado en el local storage*/
            String respuesta = objectMapper.writeValueAsString(Map.of(
                    "ok", true,
                    "id", guardado.id(),
                    "msg", "Formulario sincronizado correctamente"
            ));

            ctx.send(respuesta);
        } catch (JsonMappingException | IllegalArgumentException e) {
            enviarError(ctx, e.getMessage());
        } catch (Exception e){
            enviarError(ctx, "Error al procesar el formulario");
        }
    }

    //Cuando se cierra la conexion
    public void onClose(WsCloseContext ctx)
    {
        String usuarioId = ctx.attribute("usuarioId");
        if(usuarioId != null){
            sesiones.remove(usuarioId);
            System.out.println("WS desconectado: " + usuarioId);
        }
    }

    //Por si hay error en la conexion
    public void onError(WsErrorContext ctx)
    {
        String usuarioId = ctx.attribute("usuarioId");
        assert ctx.error() != null;
        System.out.println("WS error para usuario " + usuarioId + ": " + ctx.error().getMessage());
    }

    //metodo de utilidad para mandar errores
    private void enviarError(WsMessageContext ctx, String mensaje) {
        try {
            ctx.send(objectMapper.writeValueAsString(Map.of(
                    "ok", false,
                    "msg", mensaje
            )));
        } catch (Exception _) {}
    }
}
