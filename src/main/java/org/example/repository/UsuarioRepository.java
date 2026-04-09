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

    public UsuarioRepository() {};

    //Crear usuario: crea un usuario a ser almacenado en la bd con los datos ingresados
    public Usuario crear(String nombre, String email, String password, Usuario.Rol rol){
        String hashed_ps = BCrypt.hashpw(password, BCrypt.gensalt());
        Usuario usuario = new Usuario(nombre, email, hashed_ps, rol);
        ds.save(usuario);
        return usuario;
    }

    /* actualizar busca el usuario con el id dado, y en caso de ser encontrado
    * actualiza los campos con los datos proporcionados en los argumentos.
    * Para actualizar la contrasena debe crear un hash nuevo.
    * */
    public void actualizar(String id, String nombre, String email, String password, Usuario.Rol rol){
        String password_hash = BCrypt.hashpw(password, BCrypt.gensalt());
        ds.find(Usuario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .update(
                        new UpdateOptions(),
                        UpdateOperators.set("nombre", nombre),
                        UpdateOperators.set("email", email),
                        UpdateOperators.set("password", password_hash),
                        UpdateOperators.set("rol", rol)
                );
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

    /*
    Para verificar que la contraseña dada coincida con el hash
    util para autenticar
    */
    public Boolean verificarPassword(String password, String hash){
        return BCrypt.checkpw(password, hash);
    }

    public List<Usuario> listarTodos(){
        return ds.find(Usuario.class)
                .filter(Filters.eq("activo", true))
                .iterator()
                .toList();
    }

    public void desactivar(String id){
        ds.find(Usuario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .update(new UpdateOptions(), UpdateOperators.set("activo", false));

    }
}
