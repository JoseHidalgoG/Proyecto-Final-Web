package org.example.dto;

import org.example.model.Formulario;

import java.time.LocalDateTime;

public record FormularioResponse(
        String id,
        String usuarioId,
        String nombreEncuestado,
        String sector,
        String nivelEscolar,
        double latitud,
        double longitud,
        String fotoBase64,
        LocalDateTime creadoEn,
        boolean sincronizado
) {
    public static FormularioResponse from(Formulario formulario){
        return new FormularioResponse(
                formulario.getId().toHexString(),
                formulario.getUsuario().getId().toHexString(),
                formulario.getNombreEncuestado(),
                formulario.getSector(),
                formulario.getNivelEducacion().getEtiqueta(),
                formulario.getLatitud(),
                formulario.getLongitud(),
                formulario.getFotoBase64(),
                formulario.getCreadoEn(),
                formulario.isSincronizado()
        );

    }
}
