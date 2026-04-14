package org.example.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.example.model.Usuario;

import java.util.Date;
/*Clase para generacion/verificacion de tokens
* no es la version final y puede cambiar
* por si cualquier cosa pasa*/
public class JwtUtil {

    public static final String COOKIE_NAME = "auth_token";
    public static final int COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

    private static final String SECRETO = System.getenv()
            .getOrDefault("JWT_SECRET", "clave-secreta-temporal");

    private static final Algorithm ALGORITMO = Algorithm.HMAC256(SECRETO);

    private static final long TIEMPO_EXPIRACION = 1000L * COOKIE_MAX_AGE_SECONDS;

    //aqui se generan los tokens
    public static String generarToken(Usuario usuario){
        return JWT.create()
                .withSubject(usuario.getId().toHexString())
                .withClaim("email", usuario.getEmail())
                .withClaim("rol", usuario.getRol().name())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(
                        System.currentTimeMillis() + TIEMPO_EXPIRACION
                )).sign(ALGORITMO);
    }

    //validacion y decodificacion de tokens
    public static DecodedJWT verificarToken(String token){
        try {
            //se toma el algoritmo guardado para decodificaar y confirmar la validez del token
            return JWT.require(ALGORITMO).build().verify(token);
        } catch (JWTVerificationException e) {
            return null; //se retorna null si el token es invalido o expirado
        }
    }

    public static String extraerUsuarioId(String token){
        DecodedJWT jwt = verificarToken(token);
        return jwt != null ? jwt.getSubject() : null;
    }

    public static String extraerUsuarioRol(String token){
        DecodedJWT jwt = verificarToken(token);
        return jwt != null ? jwt.getClaim("rol").asString() : null;
    }

}
