package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OpsSupport {

	@JsonProperty("CLI")
	private String cli;

	@JsonProperty("Docker Support")
	private String docker;

	@JsonProperty("Backup Feature")
	private String backup;

	@JsonProperty("System Requirements")
	private String systemRequirements;

	@JsonProperty("Supported Databases")
	private String supportedDatabases;

	@JsonProperty("Clustering")
	private String clustering;
	
	@JsonProperty("Bulk Import")
	private String bulkImport;

}
