.DEFAULT_GOAL = configure

.PHONY: run-test
run-test: configure
	yarn run test

.PHONY: run-test-user
run-test-user: configure
	yarn run test-user

.PHONY: run-generator
run-generator: configure
	type yo || npm install -g yo
	rm -rf tmp/ || true
	mkdir -p tmp/
	cd tmp/; yo bespoke-sfeirevent

# Configuration

.PHONY: configure
configure: node_modules module-link

.PHONY: module-link
module-link: 
	type yarn || npm install -g yarn
	yarn link

.PHONY: module-unlink
module-unlink: 
	type yarn || npm install -g yarn
	yarn unlink

node_modules:
	type yarn || npm install -g yarn
	yarn

.PHONY: reset-configuration
reset-configuration: clean
	rm -rf node_modules || true
