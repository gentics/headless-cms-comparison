package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SDKInfo {
	@JsonProperty("SDK [Java]")
	private String sdkJava;

	@JsonProperty("SDK [C#]")
	private String sdkCSharp;

	@JsonProperty("SDK [PHP]")
	private String sdkPHP;

	@JsonProperty("SDK [JavaScript]")
	private String sdkJS;

	@JsonProperty("SDK [React]")
	private String sdkReact;

	@JsonProperty("SDK [AngularJS]")
	private String sdkAngular;

	@JsonProperty("SDK [TypeScript]")
	private String sdkTypescript;
}
