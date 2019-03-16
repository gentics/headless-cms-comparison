package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ContentHandlingSupport {
	@JsonProperty("Content Scheduling")
	private String contentScheduling;
	@JsonProperty("Editing Conflict Detection")
	private String conflictDetection;

	@JsonProperty("Content Model / Schema Versioning")
	private String schemaVersioning;

	@JsonProperty("Content Migration")
	private String contentMigration;

	@JsonProperty("Workflows")
	private String workflows;

	@JsonProperty("Versioning")
	private String versioning;

}
