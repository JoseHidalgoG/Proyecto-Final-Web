package org.example.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.example.model.Formulario;
import org.example.model.NivelEducacion;
import org.example.model.Usuario;
import org.example.repository.FormularioRepository;
import org.example.repository.UsuarioRepository;

import java.util.List;

public class FormularioGrpcServiceImpl extends FormularioGrpcServiceGrpc.FormularioGrpcServiceImplBase{

    private final FormularioRepository formularioRepository;
    private final UsuarioRepository usuarioRepository;

    public FormularioGrpcServiceImpl(FormularioRepository formularioRepository, UsuarioRepository usuarioRepository) {
        this.formularioRepository = formularioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void crearFormulario(CrearFormularioRequest request, StreamObserver<FormularioResponse> responseObserver){
        try {
            //primero se valida que el usuario exista
            Usuario usuario = usuarioRepository.buscarPorId(request.getUsuarioId());

            //si el usuario es nulo o esta desactivado el observador entonces va y reporta error
            if (usuario == null || !usuario.getEstado()) {
                responseObserver.onError(
                        Status.NOT_FOUND
                                .withDescription("Usuario no encontrado")
                                .asRuntimeException()
                );
                return;
            }

            //validar que los campos no esten vacios
            request.getNombreEncuestado();
            if(
                    request.getNombreEncuestado().isBlank() ||
                    request.getSector().isBlank() ||
                    request.getNivelEscolar().isBlank()
            )
            {
                responseObserver.onError(
                        Status.INVALID_ARGUMENT
                                .withDescription("Asegurese de llenar todos los campos")
                                .asRuntimeException()
                );
                return;
            }

            //Despues de validar se construye y se guarda el formulario
            Formulario formulario = new Formulario(
                    usuario,
                    request.getNombreEncuestado(),
                    request.getSector(),
                    NivelEducacion.valueOf(request.getNivelEscolar().toUpperCase()),
                    request.getLatitud(),
                    request.getLongitud(),
                    request.getFotoBase64()
            );
            Formulario guardado = formularioRepository.guardar(formulario);

            //Por ultimo se construye y envia la respuesta el observador
            responseObserver.onNext(toProto(guardado));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException e) {
            responseObserver.onError(
                    Status.INVALID_ARGUMENT
                            .withDescription(e.getMessage())
                            .asRuntimeException()
            );
        } catch (Exception e) {
            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("Error interno del servidor")
                            .asRuntimeException()
            );
        }
    }

    @Override
    public void listarPorUsuario(ListarPorUsuarioRequest request, StreamObserver<ListaFormularioResponse> responseObserver){
        try {
            List<Formulario> formularios = formularioRepository.listarPorUsuario(request.getUsuarioId());

            //Convertir cada formulario al mensaje Protobuf
            ListaFormularioResponse.Builder builder = ListaFormularioResponse.newBuilder();

            formularios.stream()
                    .map(this::toProto)
                    .forEach(builder::addFormularios);

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("Error al listar formularios")
                            .asRuntimeException()
            );
        }
    }


    //Este metodo convierte los formularios (objetos de java) a mensajes protobuf
    private FormularioResponse toProto(Formulario formulario) {
        return FormularioResponse.newBuilder()
                .setId(formulario.getId().toHexString())
                .setUsuarioId(formulario.getUsuario().getId().toHexString())
                .setNombreEncuestado(formulario.getNombreEncuestado())
                .setSector(formulario.getSector())
                .setNivelEscolar(formulario.getNivelEducacion().name())
                .setLatitud(formulario.getLatitud())
                .setLongitud(formulario.getLongitud())
                .setFotoBase64(formulario.getFotoBase64() != null ? formulario.getFotoBase64() : "")
                .setCreadoEn(formulario.getCreadoEn().toString())
                .setSincronizado(formulario.isSincronizado())
                .build();
    }


}
