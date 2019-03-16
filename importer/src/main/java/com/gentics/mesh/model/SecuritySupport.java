package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SecuritySupport {

	@JsonProperty("API Keys")
	private String apiKeys;

	@JsonProperty("OAuth 2.0 Support")
	private String oauth2;

	@JsonProperty("User Management")
	private String userManagement;

	@JsonProperty("Role Based Permissions")
	private String roleBasedPermissions;

	@JsonProperty("Document Level Permissions")
	private String documentLevelPermissions;

	@JsonProperty("auditing")
	private boolean auditing;

	public SecuritySupport() {
	}
}
