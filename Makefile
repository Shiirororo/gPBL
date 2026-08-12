API_URL ?= http://localhost:8000/api
usr ?= testuser
PASSWORD ?= securepassword123
CHALLENGE_ID ?= 2
RESULT_ID ?= 105



# File to store the token temporarily for other requests
TOKEN_FILE = .token.json

.PHONY: register login refresh submit list-submissions submission-detail clean

register:
	@echo "Registering user: $(usr)"
	@curl -s -X POST $(API_URL)/auth/register/ \
		-H "Content-Type: application/json" \
		-d '{"user_name": "$(usr)", "password": "$(PASSWORD)"}' | jq .

login:
	@echo "Logging in user: $(usr)"
	@curl -s -X POST $(API_URL)/auth/login/ \
		-H "Content-Type: application/json" \
		-d '{"user_name": "$(usr)", "password": "$(PASSWORD)"}' > $(TOKEN_FILE)
	@cat $(TOKEN_FILE) | jq .
	@echo "Tokens saved to $(TOKEN_FILE)"

refresh:
	@echo "Refreshing token"
	@if [ ! -f $(TOKEN_FILE) ]; then echo "Please run 'make login' first"; exit 1; fi
	@REFRESH_TOKEN=$$(cat $(TOKEN_FILE) | jq -r .refresh); \
	curl -s -X POST $(API_URL)/auth/refresh/ \
		-H "Content-Type: application/json" \
		-d "{\"refresh\": \"$$REFRESH_TOKEN\"}" | jq .

submit:
	@echo "Submitting code for challenge $(CHALLENGE_ID)"
	@if [ ! -f $(TOKEN_FILE) ]; then echo "Please run 'make login' first"; exit 1; fi
	@ACCESS_TOKEN=$$(cat $(TOKEN_FILE) | jq -r .access); \
	curl -s -X POST $(API_URL)/challenge/$(CHALLENGE_ID)/submit/ \
		-H "Authorization: Bearer $$ACCESS_TOKEN" \
		-H "Content-Type: application/json" \
		-d '{"code": "print(int(input()) * 2)"}' | jq .

list-submissions:
	@echo "Listing submissions for challenge $(CHALLENGE_ID)"
	@if [ ! -f $(TOKEN_FILE) ]; then echo "Please run 'make login' first"; exit 1; fi
	@ACCESS_TOKEN=$$(cat $(TOKEN_FILE) | jq -r .access); \
	curl -s -X GET $(API_URL)/challenge/$(CHALLENGE_ID)/submissions/ \
		-H "Authorization: Bearer $$ACCESS_TOKEN" | jq .

submission-detail:
	@echo "Getting detail for submission $(RESULT_ID)"
	@if [ ! -f $(TOKEN_FILE) ]; then echo "Please run 'make login' first"; exit 1; fi
	@ACCESS_TOKEN=$$(cat $(TOKEN_FILE) | jq -r .access); \
	curl -s -X GET $(API_URL)/submissions/$(RESULT_ID)/ \
		-H "Authorization: Bearer $$ACCESS_TOKEN" | jq .

clean:
	@rm -f $(TOKEN_FILE)
	@echo "Cleaned up token file"
