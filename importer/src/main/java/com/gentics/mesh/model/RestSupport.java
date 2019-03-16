package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RestSupport {

	@JsonProperty("REST API")
	private String restAPI;

	@JsonProperty("REST [Create]")
	private String restCreate;

	@JsonProperty("REST [Read]")
	private String restRead;

	@JsonProperty("REST [Update]")
	private String restUpdate;

	@JsonProperty("REST [Delete]")
	private String restDelete;

	@JsonProperty("REST [Upload]")
	private String restUpload;
	
}
