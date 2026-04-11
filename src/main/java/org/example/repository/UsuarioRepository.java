package org.example.repository;

import dev.morphia.Datastore;
import dev.morphia.UpdateOptions;
import dev.morphia.query.filters.Filters;
import dev.morphia.query.updates.UpdateOperators;
import org.bson.types.ObjectId;
import org.example.database.Database;
import org.example.model.Usuario;
import org.mindrot.jbcrypt.BCrypt;

import java.util.List;
//clase sujeta a cambios
public class UsuarioRepository {

    private final Datastore ds = Database.getDatastore();

    public UsuarioRepository() {}

    //Crear usuario: crea un usuario a ser almacenado en la bd con los datos ingresados
    public Usuario crear(Usuario usuario) {
        ds.save(usuario);
        return usuario;
    }

    /* actualizar busca el usuario con el id dado, y en caso de ser encontrado
    * actualiza los campos con los datos proporcionados en los argumentos.
    * Para actualizar la contrasena debe crear un hash nuevo.
    * */
    public Usuario actualizar(String id, String nombre, String email, String password_hash, Usuario.Rol rol){
        ds.find(Usuario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .update(
                        new UpdateOptions(),
                        UpdateOperators.set("nombre", nombre),
                        UpdateOperators.set("email", email),
                        UpdateOperators.set("passwordHash", password_hash),
                        UpdateOperators.set("rol", rol)
                );
        return ds.find(Usuario.class).filter(Filters.eq("_id", new ObjectId(id))).first();
    }
    //funciones para buscar (ya sea por cualquier campo casi)
    public Usuario buscarPorNombre(String nombre){
        return ds.find(Usuario.class)
                .filter(Filters.eq("nombre",  nombre))
                .first();
    }
    public Usuario buscarPorEmail(String email){
        return ds.find(Usuario.class)
                .filter(Filters.eq("email",  email))
                .first();
    }

    public Usuario buscarPorId(String id){
        return ds.find(Usuario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .first();
    }

    //metodos para listar
    public List<Usuario> listarTodos(){
        return ds.find(Usuario.class).iterator().toList();
    }

    public List<Usuario> listarTodosActivos(){
        return ds.find(Usuario.class)
                .filter(Filters.eq("estado", true))
                .iterator().toList();
    }

    public List<Usuario> listarPorRol(Usuario.Rol rol){
        return ds.find(Usuario.class)
                .filter(Filters.eq("rol", rol.toString()))
                .iterator().toList();
    }

    /*
    Para verificar que la contraseña dada coincida con el hash
    util para autenticar
    */
    public Boolean verificarPassword(String password, String hash){
        return BCrypt.checkpw(password, hash);
    }

    //para desactivar dinosaurios
    public void desactivar(String id){
        ds.find(Usuario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .update(new UpdateOptions(), UpdateOperators.set("estado", false));

    }
}
