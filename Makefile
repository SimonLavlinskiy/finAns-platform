WORKSPACE_CONFIG ?= workspace.yaml
WORKSPACE_DIR := ./workspace
SCRIPTS_DIR := scripts/workspace

.PHONY: workspace-init workspace-verify init verify

workspace-init:
	@node $(SCRIPTS_DIR)/init.mjs $(WORKSPACE_CONFIG)

workspace-verify:
	@node $(SCRIPTS_DIR)/verify.mjs $(WORKSPACE_CONFIG)

init: workspace-init
verify: workspace-verify
