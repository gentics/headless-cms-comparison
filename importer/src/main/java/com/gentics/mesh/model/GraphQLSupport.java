package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GraphQLSupport {

	@JsonProperty("GraphQL API")
	private String graphQLAPI;

	@JsonProperty("GraphQL [Mutations]")
	private String graphQLMutations;

	@JsonProperty("GraphQL [Subscriptions]")
	private String graphQLSubscriptions;
}
