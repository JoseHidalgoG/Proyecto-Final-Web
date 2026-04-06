package org.example.model;

import dev.morphia.annotations.Entity;
import dev.morphia.annotations.Id;
import dev.morphia.annotations.Property;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;

@Entity("usuarios")
public class Usuario {
    @Id
    private ObjectId id;

    @Property("nombre")
    private String nombre;

    @Property("email")
    private String email;

    @Property("passwordHash")
    private String passwordHash;

    @Property("rol")
    private Rol rol = Rol.PERSONAL;

    @Property("fechaCreacion")
    private final LocalDateTime fechaCreacion = LocalDateTime.now();

    @Property("estado")
    private Boolean estado;

    public enum Rol{
        ADMIN, PERSONAL
    }

    public Usuario(String nombre, String email, String password, Rol rol) {
        this.nombre = nombre;
        this.email = email;
        this.passwordHash = password;
        this.rol = rol;
    }

    public Usuario() {};

    public ObjectId getId() {
        return id;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }
}
