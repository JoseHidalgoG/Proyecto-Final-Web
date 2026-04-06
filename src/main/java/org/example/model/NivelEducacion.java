package org.example.model;

public enum NivelEducacion {
    PRIMARIA("Primaria"),
    SECUNDARIA("Secundaria"),
    GRADO_UNIVERSITARIO("Grado Universitario"),
    POSTGRADO("Postgrado"),
    DOCTORADO("Doctorado");

    private final String etiqueta;
    NivelEducacion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}