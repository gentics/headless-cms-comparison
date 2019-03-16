package com.gentics.mesh;

import java.util.HashSet;
import java.util.Set;

import com.gentics.mesh.core.rest.microschema.impl.MicroschemaResponse;
import com.gentics.mesh.core.rest.node.NodeCreateRequest;
import com.gentics.mesh.core.rest.node.NodeResponse;
import com.gentics.mesh.core.rest.node.field.impl.StringFieldImpl;
import com.gentics.mesh.core.rest.project.ProjectCreateRequest;
import com.gentics.mesh.core.rest.project.ProjectResponse;
import com.gentics.mesh.core.rest.role.RolePermissionRequest;
import com.gentics.mesh.core.rest.schema.impl.BinaryFieldSchemaImpl;
import com.gentics.mesh.core.rest.schema.impl.SchemaCreateRequest;
import com.gentics.mesh.core.rest.schema.impl.SchemaResponse;
import com.gentics.mesh.core.rest.schema.impl.StringFieldSchemaImpl;
import com.gentics.mesh.rest.client.MeshRestClient;

import io.reactivex.Completable;
import io.reactivex.Single;
import io.vertx.core.Vertx;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

public class Importer {

	private static final Logger log = LoggerFactory.getLogger(Importer.class);

	private static final String PROJECT_NAME = "comparison";

	private Vertx vertx = Vertx.vertx();
	private MeshRestClient client = MeshRestClient.create("localhost", 8080, false);

	public static void main(String[] args) {
		new Importer().run();
	}

	public void run() {
		client.setLogin("admin", "admin");
		client.login().blockingGet();

		long start = System.currentTimeMillis();
		loadProject()
			.flatMapCompletable(project -> {
				return createMicroschemas().andThen(createSchemas())
					.andThen(
						createFolders(project))
					.andThen(
						grantPermissions(project));
			})
			.subscribe(() -> {
				long dur = System.currentTimeMillis() - start;
				System.out.println("Import done. Took: " + dur + "[ms]");
			}, err -> {
				err.printStackTrace();
			});

	}

	private Completable createFolders(ProjectResponse project) {
		String uuid = project.getRootNode().getUuid();
		Set<Completable> operations = new HashSet<>();
		operations.add(createFolder(uuid, "systems", "Systeme").flatMapCompletable(this::importSystems));
		return Completable.merge(operations);
	}

	private Completable importSystems(NodeResponse folder) {
		Set<Completable> operations = new HashSet<>();
		return Completable.merge(operations);
	}

	private Single<NodeResponse> createFolder(String uuid, String slug, String name) {
		NodeCreateRequest request = new NodeCreateRequest();
		request.setParentNodeUuid(uuid);
		request.setLanguage("en");
		request.setSchemaName("folder");
		request.getFields().put("name", new StringFieldImpl().setString(name));
		request.getFields().put("slug", new StringFieldImpl().setString(slug));
		return client.createNode(PROJECT_NAME, request).toSingle().doOnError(err -> {
			log.error("Error while creating folder {" + name + "}", err);
		});
	}

	private Completable grantPermissions(ProjectResponse project) {
		return client.findRoles().toSingle().flatMapCompletable(list -> {
			String roleUuid = list.getData().stream().filter(u -> u.getName().equals("anonymous")).map(u -> u.getUuid()).findFirst().get();
			RolePermissionRequest request = new RolePermissionRequest();
			request.setRecursive(true);
			request.getPermissions().setRead(true);
			request.getPermissions().setReadPublished(true);
			return client.updateRolePermissions(roleUuid, "projects/" + project.getUuid(), request).toCompletable()
				.andThen(client.updateRolePermissions(roleUuid, "schemas", request).toCompletable());
		});
	}

	private Single<ProjectResponse> loadProject() {
		return client.findProjectByName(PROJECT_NAME).toSingle().onErrorResumeNext(err -> {
			ProjectCreateRequest request = new ProjectCreateRequest();
			request.setName(PROJECT_NAME);
			request.setSchemaRef("folder");
			return client.createProject(request).toSingle();
		});
	}

	private Completable createSchemas() {
		Set<Completable> operations = new HashSet<>();
		operations.add(createCMSSchema());
		return Completable.merge(operations);
	}

	private Completable createMicroschemas() {
		Set<Completable> operations = new HashSet<>();
		return Completable.merge(operations);
	}

	public Completable linkSchema(Single<SchemaResponse> schema) {
		return schema.flatMapCompletable(response -> {
			return client.assignSchemaToProject(PROJECT_NAME, response.getUuid()).toCompletable();
		});
	}

	public Completable linkMicroschema(Single<MicroschemaResponse> schema) {
		return schema.flatMapCompletable(response -> {
			return client.assignMicroschemaToProject(PROJECT_NAME, response.getUuid()).toCompletable();
		});
	}

	private Completable createCMSSchema() {
		SchemaCreateRequest request = new SchemaCreateRequest();
		request.setName("CMS");
		request.setContainer(false);
		request.setSegmentField("binary");
		request.setDisplayField("name");
		request.addField(new StringFieldSchemaImpl().setName("name").setLabel("Name"));
		request.addField(new StringFieldSchemaImpl().setName("description").setLabel("Description"));
		request.addField(new BinaryFieldSchemaImpl().setName("binary").setLabel("Logo"));
		return linkSchema(client.createSchema(request).toSingle());
	}

}
