package org.example.dto;

import org.example.model.Usuario;

import java.time.LocalDateTime;

public record UsuarioResponse(
        String id,
        String nombre,
        String email,
        Usuario.Rol rol,
        LocalDateTime fechaCreacion,
        Boolean activo
) {
    public static UsuarioResponse from(Usuario usuario)
    {
        return new UsuarioResponse(
                usuario.getId().toHexString(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getFechaCreacion(),
                usuario.getEstado()
        );
    }
}
