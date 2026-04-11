package org.example.dto;

import org.example.model.Usuario;

import java.time.LocalDateTime;

public record UsuarioResponse(
        String nombre,
        String email,
        String passwordHash,
        Usuario.Rol rol,
        LocalDateTime fechaCreacion,
        Boolean activo
) {
    public static UsuarioResponse from(Usuario usuario)
    {
        return new UsuarioResponse(
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getPasswordHash(),
                usuario.getRol(),
                usuario.getFechaCreacion(),
                usuario.getEstado()
        );
    }
}
