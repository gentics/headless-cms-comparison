package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CMSInfo {

	@JsonProperty("Timestamp")
	private String timestamp;

	@JsonProperty("name")
	private String name;

	@JsonProperty("Version")
	private String version;

	@JsonProperty("License")
	private String license;

	@JsonProperty("Inception")
	private String inception;

	@JsonProperty("Category")
	private String category;

	@JsonProperty("Open Source")
	private String openSource;

	@JsonProperty("Cloud Service")
	private String cloudService;

	@JsonProperty("On Premises Installation")
	private String onPremis;

	@JsonProperty("Cloud Service Hosted in Europe")
	private String euCloudService;

	@JsonProperty("Commercial Support Available?")
	private String commercialSupport;

	private GraphQLSupport graphql;

	private RestSupport rest;

	private SearchSupport search;

	private AssetSupport asset;

	private OpsSupport ops;

	@JsonProperty("Import/Export")
	private String importExport;

	private SDKInfo sdk;

	@JsonProperty("Web Hooks")
	private String webhooks;

	@JsonProperty("Eventbus")
	private String eventbus;

	@JsonProperty("Client Side Forms")
	private String forms;

	@JsonProperty("Plugin System")
	private String pluginSystem;

	@JsonProperty("Customizable UI")
	private String customUI;

	private SecuritySupport security;

	private ContentStructureSupport content;

	private ContentHandlingSupport handling;

	@JsonProperty("GDPR Statement")
	private String gdprStatement;

	@JsonProperty("GDPR API")
	private String gdprAPI;

	@JsonProperty("Special Features")
	private String specialFeatures;

}
