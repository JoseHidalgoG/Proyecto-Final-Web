package org.example.services;

import io.javalin.http.ForbiddenResponse;
import io.javalin.http.NotFoundResponse;
import org.example.dto.UsuarioRequest;
import org.example.dto.UsuarioResponse;
import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.mindrot.jbcrypt.BCrypt;

import java.util.Arrays;

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
    public UsuarioResponse registrarUsuario(UsuarioRequest request, Usuario actor, Boolean admin)
    {
        //antes de empezar se debe verificar el usuario que llama la funcion tenga la
        //autorizacion necesaria para crear usuarios (tener admin)
        validarAdmin(actor);
        //Luego se pasa a validar que lo introducido cumpla con las reglas
        validarDatos(request);

        //se hashea la contrasena
        String password_hash = BCrypt.hashpw(request.password, BCrypt.gensalt());

        //Se pasa a instanciar el objeto de usuario y se persiste en la db
        Usuario usuario = new Usuario(request.nombre,
                request.email,
                password_hash,
                admin ? Usuario.Rol.ADMIN : Usuario.Rol.PERSONAL);
        return UsuarioResponse.from(usuarioRepository.crear(usuario));
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

    public void validarDatos(UsuarioRequest usuario)
    {
        //lo primero a verificar es que los campos no esten vacios
        if (
                usuario == null ||
                usuario.nombre == null ||
                usuario.nombre.isBlank() ||
                usuario.email == null ||
                usuario.email.isBlank() ||
                usuario.password == null ||
                usuario.password.isBlank())
        {
            throw new IllegalArgumentException("Campos vacios detectados, Asegurese de llenarlos todos");
        }

        //luego se pasa a verificar que el correo tenga arroba
        if(!usuario.email.contains("@"))
        {
            throw new IllegalArgumentException("correo no valido");
        }

        //el password debe tener por lo menos
        if (usuario.password.length() < 4)
        {
            throw new IllegalArgumentException("El password debe tener al menos 4 caracteres");
        }
    }

    public void validarAdmin(Usuario usuario)
    {
        if (usuario.getRol() != Usuario.Rol.ADMIN)
        {
            throw new IllegalArgumentException("Usuario no autorizado");
        }
    }
}
