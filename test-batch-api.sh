#!/bin/bash

curl -X POST http://localhost:8080/api/content/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{"posts":[{"text":"Just got an offer from Google after 5 rounds of coding interviews on graphs and dynamic programming"},{"text":"Amazon rejected me after the system design round about distributed caching"},{"text":"Meta interview was great - behavioral questions about leadership and team collaboration"}],"userId":1}'
