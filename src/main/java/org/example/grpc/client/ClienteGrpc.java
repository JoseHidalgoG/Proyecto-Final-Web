package org.example.grpc.client;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.example.grpc.*;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
/*
* Clase que sirve como cliente para la
*
* */
public class ClienteGrpc  extends JFrame {

    //componentes de la interfaz de usuario
    private final FormularioGrpcServiceGrpc.FormularioGrpcServiceBlockingStub stub;

    private final JTextField txtUsuarioId = new JTextField(20);
    private final JTextField txtNombre = new JTextField(20);
    private final JTextField txtSector =  new JTextField(20);
    private final JComboBox<String> cboNivel = new JComboBox<>(
            new String[] {"BASICO", "MEDIO", "GRADO_UNIVERSITARIO", "POSTGRADO", "DOCTORADO"
            });
    private final JTextField txtLatitud = new JTextField("0.0", 10);
    private final JTextField txtLongitud = new JTextField("0.0", 10);
    private final JLabel lblFoto = new JLabel("Sin foto seleccionada");
    private String fotoBase64Seleccionada = "";

    private final DefaultTableModel tableModel = new DefaultTableModel(
            new String[]{"ID", "Nombre", "Sector", "Nivel", "Lat", "Lng", "Sincronizado"}, 0
    );
    private final JTable tabla = new JTable(tableModel);
    private final JLabel lblStatus = new JLabel("Listo");

    public ClienteGrpc(String host, int port) {
        super("Cliente gRPC - Encuestas");

        //Crear canal de conexion al servidor gRPC
        ManagedChannel channel = ManagedChannelBuilder
                .forAddress(host, port)
                .usePlaintext()
                .build();

        stub = FormularioGrpcServiceGrpc.newBlockingStub(channel);

        construirUI();
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 600);
        setLocationRelativeTo(null);
        setVisible(true);
    }

    private void construirUI() {
        setLayout(new BorderLayout(10, 10));
        
        //Panel izquierdo: parte donde se pone el modulo para crear formulario
        JPanel panelForm = new JPanel(new GridBagLayout());
        panelForm.setBorder(BorderFactory.createTitledBorder("Crear Formulario"));
        GridBagConstraints constraints = new GridBagConstraints(); //declaracion y configuracion del constraint
        constraints.insets = new Insets(4, 4, 4, 4);
        constraints.anchor = GridBagConstraints.WEST;
        constraints.fill = GridBagConstraints.HORIZONTAL;

        //array de strings de labels y componentes a mostrar
        JButton btnSeleccionarFoto = new JButton("Seleccionar foto");
        btnSeleccionarFoto.addActionListener(e -> seleccionarFoto());
        JPanel panelFoto = new JPanel(new BorderLayout(5, 0));
        panelFoto.add(lblFoto, BorderLayout.CENTER);
        panelFoto.add(btnSeleccionarFoto, BorderLayout.EAST);

        String[] labels = {"ID Usuario: ", "Nombre encuestado:", "Sector:",
                "Nivel educacion:", "Latitud:", "Longitud:", "Foto:"};
        Component[] fields = {
                txtUsuarioId,  txtNombre, txtSector,
                cboNivel, txtLatitud, txtLongitud, panelFoto
        };

        //bucle en donde se añade cada componente por orden de array
        for (int i = 0; i < labels.length; i++) {
            constraints.gridx = 0;
            constraints.gridy = i;
            panelForm.add(new JLabel(labels[i]), constraints);
            constraints.gridx = 1;
            panelForm.add(fields[i], constraints);
        }

        //adicion de boton de crear y llamada de actionEvent para crear formulario
        JButton btnCrear = new JButton("Crear formulario");
        btnCrear.addActionListener(e -> crearFormulario());
        constraints.gridx = 0;
        constraints.gridy = labels.length;
        constraints.gridwidth = 2;
        panelForm.add(btnCrear, constraints);

        // Panel derecho: parte donde se muestra el listado de registros
        JPanel panelLista = new JPanel(new BorderLayout(5, 5));
        panelLista.setBorder(BorderFactory.createTitledBorder("Lista de formularios"));

        JPanel panelBuscar = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JTextField txtBuscarId = new JTextField(20);
        JButton btnListar = new JButton("Listar");
        btnListar.addActionListener(e -> listarPorUsuario(txtBuscarId.getText().trim()));
        panelBuscar.add(new JLabel("ID Usuario:"));
        panelBuscar.add(txtBuscarId);
        panelBuscar.add(btnListar);
        panelLista.add(panelBuscar, BorderLayout.NORTH);
        panelLista.add(new JScrollPane(tabla), BorderLayout.CENTER);

        //Layout principal
        JSplitPane splitPane = new JSplitPane(
                JSplitPane.HORIZONTAL_SPLIT, panelForm, panelLista
        );
        splitPane.setDividerLocation(300);

        add(splitPane, BorderLayout.CENTER);
        add(lblStatus, BorderLayout.SOUTH);
    }

    private void listarPorUsuario(String usuarioId) {
        //se valida que argumento no este vacio
        if(usuarioId.isEmpty()){
            JOptionPane.showMessageDialog(this, "Ingrese un ID de usuario");
            return;
        }

        //se intenta obtener los registros tomando en cuenta cualquier excepcion que pueda pasar
        try {
            ListarPorUsuarioRequest request = ListarPorUsuarioRequest
                    .newBuilder()
                    .setUsuarioId(usuarioId)
                    .build();

            ListaFormularioResponse response = stub.listarPorUsuario(request);

            //Limpiar tabla y rellenar con resultados
            tableModel.setRowCount(0);
            List<FormularioResponse> lista = response.getFormulariosList();

            for(FormularioResponse f : lista){
                tableModel.addRow(new Object[]{
                        f.getId(),
                        f.getNombreEncuestado(),
                        f.getSector(),
                        f.getNivelEscolar(),
                        f.getLatitud(),
                        f.getLongitud(),
                        f.getSincronizado()
                });
            }

            lblStatus.setText("Lista de formularios");
        } catch (Exception e) { //si atrapa excepcion po se envia mensaje
            lblStatus.setText("Error: " + e.getMessage());
            JOptionPane.showMessageDialog(this,
                    "Error: " + e.getMessage(),
                    "Error",
                    JOptionPane.ERROR_MESSAGE
            );
        }
    }

    //llamar al metodo gRPC CrearFormulario
    private void crearFormulario() {
        try {
            String usuarioId = requiredText(txtUsuarioId.getText(), "Ingrese un ID de usuario");
            String nombre = requiredText(txtNombre.getText(), "Ingrese el nombre del encuestado");
            String sector = requiredText(txtSector.getText(), "Ingrese el sector");
            String nivelEscolar = requiredText((String) cboNivel.getSelectedItem(), "Seleccione un nivel educativo");
            double latitud = requiredCoordinate(txtLatitud.getText(), "latitud");
            double longitud = requiredCoordinate(txtLongitud.getText(), "longitud");

            // para no mandar formularios incompletos
            if(fotoBase64Seleccionada.isBlank()){
                throw new IllegalArgumentException("Seleccione una foto antes de crear el formulario");
            }

            //se crea un nuevo constructor con los valores que tiene los componentes
            CrearFormularioRequest request = CrearFormularioRequest
                    .newBuilder()
                    .setUsuarioId(usuarioId)
                    .setNombreEncuestado(nombre)
                    .setSector(sector)
                    .setNivelEscolar(nivelEscolar)
                    .setLatitud(latitud)
                    .setLongitud(longitud)
                    .setFotoBase64(fotoBase64Seleccionada)
                    .build();

            FormularioResponse response = stub.crearFormulario(request);

            lblStatus.setText("Creado con ID: " + response.getId());
            JOptionPane.showMessageDialog(this,
                    "Formulario creado exitosamente\nID: " + response.getId(),
                    "Exito", JOptionPane.INFORMATION_MESSAGE
            );
            limpiarFormularioCreado();

        } catch (Exception e) {
            lblStatus.setText("Error: " + e.getMessage());
            JOptionPane.showMessageDialog(this,
                    "Error: " + e.getMessage(),
                    "Error", JOptionPane.ERROR_MESSAGE
            );
        }
    }

    private void seleccionarFoto() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Seleccionar foto del formulario");
        chooser.setFileSelectionMode(JFileChooser.FILES_ONLY);

        int result = chooser.showOpenDialog(this);
        if(result != JFileChooser.APPROVE_OPTION){
            return;
        }

        File selectedFile = chooser.getSelectedFile();

        try {
            fotoBase64Seleccionada = convertirImagenBase64(selectedFile.toPath());
            lblFoto.setText(selectedFile.getName());
            lblStatus.setText("Foto seleccionada: " + selectedFile.getName());
        } catch (Exception e) {
            limpiarFotoSeleccionada();
            lblStatus.setText("Error: " + e.getMessage());
            JOptionPane.showMessageDialog(this,
                    "Error: " + e.getMessage(),
                    "Error", JOptionPane.ERROR_MESSAGE
            );
        }
    }

    private String convertirImagenBase64(Path path) throws IOException {
        String mimeType = Files.probeContentType(path);

        if(mimeType == null || !mimeType.startsWith("image/")){
            throw new IllegalArgumentException("Seleccione un archivo de imagen valido");
        }

        // convertir imagen a Base64 para gRPC
        String base64 = Base64.getEncoder().encodeToString(Files.readAllBytes(path));
        return "data:" + mimeType + ";base64," + base64;
    }

    private String requiredText(String value, String message) {
        if(value == null || value.trim().isEmpty()){
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private double requiredCoordinate(String value, String fieldName) {
        String cleanValue = requiredText(value, "Ingrese la " + fieldName);
        double coordinate;

        try {
            coordinate = Double.parseDouble(cleanValue);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("La " + fieldName + " debe ser numerica");
        }

        if(!Double.isFinite(coordinate)){
            throw new IllegalArgumentException("La " + fieldName + " debe ser valida");
        }

        if(coordinate == 0){
            throw new IllegalArgumentException("La " + fieldName + " no puede ser 0");
        }

        return coordinate;
    }

    private void limpiarFormularioCreado() {
        txtNombre.setText("");
        txtSector.setText("");
        limpiarFotoSeleccionada();
    }

    private void limpiarFotoSeleccionada() {
        fotoBase64Seleccionada = "";
        lblFoto.setText("Sin foto seleccionada");
    }

    public static void main(String[] args){
        SwingUtilities.invokeLater(() ->
                new ClienteGrpc("localhost", 9090)
        );
    }
}
