package org.example.database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import dev.morphia.Datastore;
import dev.morphia.Morphia;

public class Database {
    private static Datastore datastore;

    public static Datastore getDatastore() {
        if (datastore == null) {
            String uri = System.getenv("MONGO_URI"); //se toma el uri desde las variables del sistema
            /*
            * al crearse la instancia de cliente, se autodescubre el archivo
            * configuración (ubicación: src/main/resources/META-INF/morphia.config.properties)
            * y ahi se lee nombre de db y se escanea las clases de entidad.
            * */
            MongoClient mongoClient = MongoClients.create(uri);

            //Para crear instancia de datastore
            datastore = Morphia.createDatastore(mongoClient);

        }
        return datastore;
    }
}
