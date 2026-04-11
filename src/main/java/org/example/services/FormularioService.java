package org.example.services;

import io.javalin.http.ForbiddenResponse;
import io.javalin.http.NotFoundResponse;
import org.example.dto.FormularioRequest;
import org.example.dto.FormularioResponse;
import org.example.model.Formulario;
import org.example.model.NivelEducacion;
import org.example.model.Usuario;
import org.example.repository.FormularioRepository;
import org.example.repository.UsuarioRepository;

import java.util.List;
/* Clase para manejar formularios
* puede cambiar
* */
public class FormularioService {
    private final FormularioRepository formularioRepository;
    private final UsuarioRepository usuarioRepository;

    public FormularioService(FormularioRepository formularioRepository, UsuarioRepository usuarioRepository) {
        this.formularioRepository = formularioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    //Para crear las instancias de formulario tomando en cuenta la entrada
    public FormularioResponse registrar(FormularioRequest request, String idUsuario)
    {
        Usuario usuario = usuarioRepository.buscarPorId(idUsuario);
        //primera regla a cumplir para registro es saber si el usuario que hizo la encuesta existe
        if(usuario == null || !usuario.getEstado())
        {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        //luego se valida los datos ingresados
        validarDatos(request);

        //finalmente se instancia el objeto y se persiste
        Formulario formulario = instanciarFormulario(request, usuario);
        return FormularioResponse.from(formularioRepository.guardar(formulario));
    }

    //para actualizar los registros
    public FormularioResponse actualizar(String id, FormularioRequest request)
    {
        Formulario formulario = formularioRepository.buscarPorId(id);
        if(formulario == null || !formulario.getEstado()){
            throw new NotFoundResponse("formulario no encontrado");
        }
        if(formulario.isSincronizado())
        {
            throw new ForbiddenResponse("No se puede actualizar un formulario sincronizado");
        }

        //validar que la entrada cumpla con las reglas
        validarDatos(request);

        return FormularioResponse.from(formularioRepository.actualizar(id, request));
    }

    //funciones de busqueda o listado
    public Formulario buscarPorId(String id) {
        return formularioRepository.buscarPorId(id);
    }

    public List<FormularioResponse> listarTodos(){
        return formularioRepository.listarTodos()
                .stream()
                .map(FormularioResponse::from)
                .toList();
    }

    public List<FormularioResponse> listarPorSector(String sector){
        return formularioRepository.listarPorSector(sector)
                .stream()
                .map(FormularioResponse::from)
                .toList();
    }

    public List<FormularioResponse> listarPorNivelEducacion(String nivelEducacion){
        return formularioRepository.
                listarPorNivelEducacion(NivelEducacion.valueOf(nivelEducacion.toUpperCase()))
                .stream()
                .map(FormularioResponse::from)
                .toList();
    }

    public List<FormularioResponse> listarPorUsuario(String usuario){
        return formularioRepository.listarPorUsuario(usuario)
                .stream()
                .map(FormularioResponse::from)
                .toList();
    }

    public List<FormularioResponse> listarPendientes(){
        return formularioRepository.listarPendientes()
                .stream()
                .map(FormularioResponse::from)
                .toList();
    }

    //para marcar las encuestas como sincronizadas una vez que se este conectado al servidor
    public void marcarSincronizado(String id){
        formularioRepository.marcarSincronizado(id);
    }

    //para eliminar registro
    public void eliminar(String id){
        formularioRepository.eliminar(id);
    }

    //funcion para verificar que los datos ingresados cumplan con las reglas del sistema
    private void validarDatos(FormularioRequest request)
    {
        //para validar que no haya valores nulos
        if(request == null ||
            request.nombreEncuestado == null || request.nombreEncuestado.isBlank() ||
            request.sector == null || request.sector.isBlank() ||
            request.nivelEscolar == null || request.nivelEscolar.isBlank()
        )
        {
            throw new  IllegalArgumentException("El formulario no puede estar vacio, asegure llenar todos lo campos");
        }

        //para validar que el nivel de educacion no se haya introducido erroneamente
        try {
            NivelEducacion.valueOf(request.nivelEscolar.toUpperCase());
        }
        catch (IllegalArgumentException e) {
            throw new  IllegalArgumentException("Nivel de educacion invalido: " + request.nivelEscolar);
        }

        //para saber si la geolocalizacion no se obtuvo (wip)
        if(request.latitud == 0 || request.longitud == 0)
        {
            throw new IllegalArgumentException("No se pudo obtener la geolocalizacion");
        }

    }

    private Formulario instanciarFormulario(FormularioRequest request, Usuario usuario){
        return new Formulario(usuario,
                request.nombreEncuestado,
                request.sector,
                NivelEducacion.valueOf(request.nivelEscolar.toUpperCase()),
                request.latitud,
                request.longitud,
                request.fotoBase64);
    }
}
