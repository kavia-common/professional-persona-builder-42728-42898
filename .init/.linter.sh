#!/bin/bash
cd /home/kavia/workspace/code-generation/professional-persona-builder-42728-42898/express_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

