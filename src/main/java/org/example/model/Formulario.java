package org.example.model;

import dev.morphia.annotations.*;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;

@Entity("formularios")
@Indexes({
        @Index(fields = @Field("usuario")),
        @Index(fields = @Field("sincronizado")),
        @Index(fields = {
                @Field("latitud"),
                @Field("longitud")
        })
})
public class Formulario {

    @Id
    private ObjectId id;

    @Reference //para poder hacer referencia documento de usuario en la db
    private Usuario usuario;

    @Property("nombreEncuestado")
    private String nombreEncuestado;

    @Property("sector")
    private String sector;

    @Property("nivelEducacion")
    private NivelEducacion nivelEducacion;

    @Property("latitud")
    private double latitud;

    @Property("longitud")
    private double longitud;

    @Property("fotoBase64")
    private String fotoBase64;

    @Property("creadoEn")
    private final LocalDateTime creadoEn = LocalDateTime.now();

    @Property("sincronizado")
    private boolean sincronizado = false; //tiene valor false por defecto hasta confirmar con el cliente

    @Property("estado")
    private Boolean estado = true;

    public Formulario() {}

    public Formulario(Usuario usuario,
                      String nombreEncuestado,
                      String sector,
                      NivelEducacion nivelEducacion,
                      double latitud,
                      double longitud,
                      String fotoBase64) {
        this.usuario = usuario;
        this.nombreEncuestado = nombreEncuestado;
        this.sector = sector;
        this.nivelEducacion = nivelEducacion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.fotoBase64 = fotoBase64;
    }

    public ObjectId getId(){ return id; }

    public Usuario getUsuario() { return usuario; }

    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getNombreEncuestado(){ return nombreEncuestado; }

    public void setNombreEncuestado(String nombreEncuestado) { this.nombreEncuestado = nombreEncuestado; }

    public String getSector(){ return sector; }

    public void setSector(String sector){ this.sector = sector; }

    public NivelEducacion getNivelEducacion() { return nivelEducacion; }

    public void setNivelEducacion(NivelEducacion nivelEducacion) { this.nivelEducacion = nivelEducacion; }

    public double getLatitud() { return latitud; }

    public void setLatitud(double latitud) { this.latitud = latitud; }

    public double getLongitud() { return longitud; }

    public void setLongitud(double longitud) { this.longitud = longitud; }

    public String getFotoBase64() { return fotoBase64; }

    public void setFotoBase64(String fotoBase64) { this.fotoBase64 = fotoBase64; }

    public LocalDateTime getCreadoEn() { return creadoEn; }

    public boolean isSincronizado(){ return sincronizado; }

    public void setSincronizado(boolean s) { this.sincronizado = s; }

    public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }
}
