package org.example.model;

public enum NivelEducacion {
    BASICO("BASICO"),
    MEDIO("MEDIO"),
    GRADO_UNIVERSITARIO("GRADO UNIVERSITARIO"),
    POSTGRADO("POSTGRADO"),
    DOCTORADO("DOCTORADO");

    private final String etiqueta;
    NivelEducacion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}