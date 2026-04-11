package org.example.repository;

import dev.morphia.Datastore;
import dev.morphia.UpdateOptions;
import dev.morphia.query.filters.Filters;
import dev.morphia.query.updates.UpdateOperators;
import org.bson.types.ObjectId;
import org.example.database.Database;
import org.example.dto.FormularioRequest;
import org.example.model.Formulario;
import org.example.model.NivelEducacion;

import java.util.List;
//clase sujeta a cambios
public class FormularioRepository {
    private final Datastore ds = Database.getDatastore();

    public FormularioRepository() {}

    public Formulario guardar(Formulario formulario){
        ds.save(formulario);
        return formulario;
    }

    /*
    * En listarPorUsuario se retorna una lista de encuestas registradas por un usuario dado
    * */
    public List<Formulario> listarPorUsuario(String usuarioId){
        return ds.find(Formulario.class)
                .filter(Filters.eq("usuario", new ObjectId(usuarioId)))
                .iterator()
                .toList();
    }
    //Para listar encuestas de un sector dado
    public List<Formulario> listarPorSector(String sector){
        return ds.find(Formulario.class)
                .filter(Filters.eq("sector", sector))
                .iterator()
                .toList();
    }
    // lo mismo pero por nivel de educacion
    public List<Formulario> listarPorNivelEducacion(NivelEducacion nivelEducacion){
        return ds.find(Formulario.class)
                .filter(Filters.eq("nivelEducacion", nivelEducacion.getEtiqueta()))
                .iterator()
                .toList();
    }

    //para listar todas las encuestas disponible para vista
    public List<Formulario> listarTodos(){
        return ds.find(Formulario.class)
                .filter(Filters.eq("estado", true))
                .iterator()
                .toList();
    }

    public Formulario buscarPorId(String id){
        return ds.find(Formulario.class).filter(Filters.eq("_id", new ObjectId(id))).first();
    }

    //para marcar las encuestas como sincronizadas una vez que se manden al servidor
    public void marcarSincronizado(String id){
        ds.find(Formulario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .update(new UpdateOptions(), UpdateOperators.set("sincronizado", true));
    }

    public Formulario actualizar(String id, FormularioRequest formulario){
        ds.find(Formulario.class)
                .filter(Filters.eq("_id", new ObjectId(id)))
                .update(
                        new UpdateOptions(),
                        UpdateOperators.set("nombreEncuestado", formulario.nombreEncuestado),
                        UpdateOperators.set("sector", formulario.sector),
                        UpdateOperators.set("nivelEscolar", formulario.nivelEscolar),
                        UpdateOperators.set("latitud", formulario.latitud),
                        UpdateOperators.set("longitud", formulario.longitud),
                        UpdateOperators.set("fotoBase64", formulario.fotoBase64)
                        );
        return buscarPorId(id);
    }

    /*
    * para eliminar encuestas no sincronizadas
    * encuestas eliminadas se quitan de la vista
    * */
    public void eliminar(String id){
        ds.find(Formulario.class)
                .filter(
                        Filters.eq("_id", new ObjectId(id)),
                        Filters.eq("sincronizado", false)
                )
                .update(new UpdateOptions(), UpdateOperators.set("estado", false));
    }

    //para listar registros pendientes de sincronizar
    public List<Formulario> listarPendientes(){
        return ds.find(Formulario.class)
                .filter(Filters.eq("sincronizado", false))
                .iterator()
                .toList();
    }
}
