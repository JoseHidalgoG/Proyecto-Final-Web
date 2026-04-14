package org.example.util;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.http.Context;
import io.javalin.http.ForbiddenResponse;
import io.javalin.http.UnauthorizedResponse;
import org.example.model.Usuario;

public class JwtFilter {
    public static void validar(Context ctx)
    {
        //primero se extrae el token y despues se verifica
        String token = extraerToken(ctx);
        DecodedJWT decodedJWT = JwtUtil.verificarToken(token);
        if(decodedJWT == null){
            throw new UnauthorizedResponse("Token inválido o expirado");
        }

        //se guardan los datos obtenidos en el contexto
        ctx.attribute("usuarioId", decodedJWT.getSubject());
        ctx.attribute("rol", decodedJWT.getClaim("rol").asString());
    }

    //para validar si el usuario tiene admin
    public static void validarAdmin(Context ctx)
    {
        validar(ctx);
        String rol =  ctx.attribute("rol");
        if(!Usuario.Rol.ADMIN.name().equals(rol)){
            throw new ForbiddenResponse("Se requiere de admin para esta operacion");
        }
    }

    //para extraer el token de la cookie de autenticacion
    private static String extraerToken(Context ctx) {
        String token = ctx.cookie(JwtUtil.COOKIE_NAME);
        if (token == null || token.isBlank()){
            throw new UnauthorizedResponse("Se requiere cookie de autenticacion");
        }
        return token;
    }
}
