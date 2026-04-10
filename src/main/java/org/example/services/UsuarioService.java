package org.example.services;

import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;

/*
* clase sujeta a cambios.
* Aqui se llama las funciones de repositorio para usuarios aplicando la lógica de negocio
* */
public class UsuarioService {
    private final UsuarioRepository usuarioRepository = new UsuarioRepository();

    public UsuarioService() {}

    /*
    * funcion para registrar usuarios nuevos, validando que cumpla con las condiciones
    * establecidas
    * */
    public Usuario registrarUsuario(String nombre, String email, String password, Usuario.Rol rol)
    {
        //No se puede tener dos usuarios con un mismo correo
        if(usuarioRepository.buscarPorEmail(email) != null)
        {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }

        //El password debe tener al menos 5 caracteres
        if(password.length() < 5)
        {
            throw new IllegalArgumentException("La contrasena debe tener al menos 5 caracteres");
        }

        return usuarioRepository.crear(nombre, email, password, rol);
    }

    /*
    * función para autenticación
    * no es la version final y puede estar sujeto a cambios.
    * */
    public Usuario login(String email, String password)
    {
        Usuario u =  usuarioRepository.buscarPorEmail(email);

        //El usuario debe de existir y estar en estado activo
        if (u == null || !u.getEstado())
        {
            throw new IllegalArgumentException("Credenciales no validas");
        }

        //Se debe verificar contrasena
        if(!usuarioRepository.verificarPassword(password, u.getPasswordHash()))
        {
            throw new IllegalArgumentException("Credenciales no validas");
        }

        return u;
    }
}
