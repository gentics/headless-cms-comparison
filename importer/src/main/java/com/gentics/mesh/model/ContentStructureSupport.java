package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ContentStructureSupport {

	@JsonProperty("Project Support")
	private String projectSupport;

	@JsonProperty("I18N Localized Content")
	private String i18Content;

	@JsonProperty("Content Trees")
	private String contentTrees;

	@JsonProperty("Tagging")
	private String tagging;

	@JsonProperty("Content Relations")
	private String relations;

	@JsonProperty("Nesting of Fields")
	private String nesting;

	@JsonProperty("Content Branches")
	private String contentBranches;

	@JsonProperty("Content Models / Schemas")
	private String schemas;

	@JsonProperty("Custom Field Types")
	private String fieldTypes;

}
